import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi.js';
import categoryApi from '../../api/categoryApi.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Loader from '../../components/Loader.jsx';
import { getApiError } from '../../utils/apiError.js';

const EMPTY_FORM = { name: '', description: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const loadCategories = useCallback(async (signal) => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await categoryApi.getCategories({ signal });
      if (!signal.aborted) setCategories(data);
    } catch (error) {
      if (!signal.aborted) setLoadError(getApiError(error, 'Could not load categories.').message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCategories(controller.signal);
    return () => controller.abort();
  }, [loadCategories, retry]);

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const editCategory = (category) => {
    setEditing(category);
    setForm({ name: category.name || '', description: category.description || '' });
    setFieldErrors({});
    document.getElementById('admin-category-name')?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Category name is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || null };
      if (editing) await adminApi.updateCategory(editing.id, payload);
      else await adminApi.createCategory(payload);
      toast.success(editing ? 'Category updated.' : 'Category created.');
      resetForm();
      setRetry((value) => value + 1);
    } catch (error) {
      const result = getApiError(error, 'Could not save this category.');
      setFieldErrors(result.fieldErrors);
      toast.error(result.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    setPendingId(category.id);
    try {
      await adminApi.deleteCategory(category.id);
      toast.success('Category deleted.');
      if (editing?.id === category.id) resetForm();
      setRetry((value) => value + 1);
    } catch (error) {
      toast.error(getApiError(error, 'Could not delete this category.').message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="section-eyebrow">Catalog</span><h2>Categories</h2></div></div>
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <form className="admin-panel admin-category-form" onSubmit={submit} noValidate>
            <h3>{editing ? 'Edit category' : 'Add category'}</h3>
            <div className="mb-3">
              <label className="form-label" htmlFor="admin-category-name">Name</label>
              <input id="admin-category-name" className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`} maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="admin-category-description">Description <span className="text-secondary">(optional)</span></label>
              <textarea id="admin-category-description" className={`form-control${fieldErrors.description ? ' is-invalid' : ''}`} rows="4" maxLength="500" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
            </div>
            <div className="d-flex gap-2"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save category' : 'Create category'}</button>{editing && <button className="btn btn-outline-secondary" type="button" onClick={resetForm} disabled={saving}>Cancel edit</button>}</div>
          </form>
        </div>
        <div className="col-12 col-lg-7">
          {loading && <Loader label="Loading categories..." />}
          {!loading && loadError && <ErrorMessage message={loadError} onRetry={() => setRetry((value) => value + 1)} />}
          {!loading && !loadError && !categories.length && <div className="admin-empty"><h3>No categories yet</h3><p>Add a category to use it in product forms.</p></div>}
          {!loading && !loadError && categories.length > 0 && <div className="admin-panel p-0"><div className="table-responsive"><table className="table align-middle admin-table mb-0"><thead><tr><th>Category</th><th>Description</th><th className="text-end">Actions</th></tr></thead><tbody>
            {categories.map((category) => <tr key={category.id}><td className="fw-semibold">{category.name}</td><td className="admin-category-description">{category.description || '—'}</td><td className="text-end text-nowrap"><button className="btn btn-sm btn-outline-primary me-2" type="button" onClick={() => editCategory(category)} disabled={saving || pendingId === category.id}>Edit</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => removeCategory(category)} disabled={saving || pendingId === category.id}>{pendingId === category.id ? 'Deleting...' : 'Delete'}</button></td></tr>)}
          </tbody></table></div></div>}
        </div>
      </div>
    </div>
  );
}
