import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminApi, { getAdminProduct } from '../../api/adminApi.js';
import categoryApi from '../../api/categoryApi.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Loader from '../../components/Loader.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { getApiError } from '../../utils/apiError.js';

const EMPTY_FORM = { name: '', description: '', price: '', stockQuantity: '', categoryId: '' };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Product name is required.';
  if (!form.description.trim()) errors.description = 'Description is required.';
  if (!form.price || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) errors.price = 'Price must be greater than zero.';
  if (form.stockQuantity === '' || !Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) errors.stockQuantity = 'Stock must be zero or greater.';
  if (!form.categoryId) errors.categoryId = 'Choose a category.';
  return errors;
}

function validateImage(file) {
  if (!file) return '';
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return 'Choose a JPG, PNG, or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 2 MB or smaller.';
  return '';
}

export default function ProductForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(location.state?.product || null);
  const [savedId, setSavedId] = useState(null);
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPageError('');
    setForm(EMPTY_FORM);
    setProduct(null);
    setSavedId(null);
    setFile(null);
    const load = async () => {
      try {
        const categoryRequest = categoryApi.getCategories();
        const routeProduct = location.state?.product;
        const productRequest = isEditing
          ? (String(routeProduct?.id) === String(id) ? Promise.resolve({ data: routeProduct }) : getAdminProduct(id).then((data) => ({ data })))
          : Promise.resolve({ data: null });
        const [{ data: categoryData }, { data: productData }] = await Promise.all([categoryRequest, productRequest]);
        if (!active) return;
        setCategories(categoryData);
        if (productData) {
          setProduct(productData);
          setForm({
            name: productData.name || '', description: productData.description || '',
            price: String(productData.price ?? ''), stockQuantity: String(productData.stockQuantity ?? ''),
            categoryId: String(productData.categoryId ?? ''),
          });
        }
      } catch (error) {
        if (active) setPageError(getApiError(error, 'Could not load the product form.').message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, isEditing, location.state]);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const changeImage = (event) => {
    const selected = event.target.files?.[0] || null;
    const imageError = validateImage(selected);
    setFile(imageError ? null : selected);
    setFieldErrors((current) => ({ ...current, image: imageError }));
    event.target.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const errors = validateForm(form);
    const imageError = validateImage(file);
    if (imageError) errors.image = imageError;
    setFieldErrors(errors);
    setPageError('');
    if (Object.keys(errors).length) return;

    setSaving(true);
    const productId = savedId || (isEditing ? id : null);
    const request = {
      name: form.name.trim(), description: form.description.trim(), price: Number(form.price),
      stockQuantity: Number(form.stockQuantity), categoryId: Number(form.categoryId),
    };
    try {
      const { data: savedProduct } = productId
        ? await adminApi.updateProduct(productId, request)
        : await adminApi.createProduct(request);
      setProduct(savedProduct);
      setSavedId(savedProduct.id);
      if (file) {
        try {
          const { data: withImage } = await adminApi.uploadProductImage(savedProduct.id, file);
          setProduct(withImage);
          setFile(null);
          toast.success('Product saved with its image.');
        } catch (uploadError) {
          setPageError(`Product saved, but the image upload failed: ${getApiError(uploadError).message}`);
          toast.error('Product saved, but image upload failed. You can retry the image upload.');
          return;
        }
      } else {
        toast.success(isEditing || productId ? 'Product updated.' : 'Product created.');
      }
      navigate('/admin/products');
    } catch (error) {
      const result = getApiError(error, 'Could not save this product.');
      setFieldErrors(result.fieldErrors);
      setPageError(result.message);
      toast.error(result.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><Loader label={isEditing ? 'Loading product...' : 'Loading categories...'} /></div>;
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="section-eyebrow">Catalog</span><h2>{isEditing ? 'Edit product' : 'Add product'}</h2></div><Link className="btn btn-outline-secondary" to="/admin/products">Back to products</Link></div>
      {pageError && <ErrorMessage message={pageError} />}
      {!categories.length && <div className="alert alert-warning">Create a category before adding products.</div>}
      <form className="admin-panel admin-product-form" onSubmit={submit} noValidate>
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <label className="form-label" htmlFor="product-name">Name</label>
            <input id="product-name" className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`} name="name" maxLength="150" value={form.name} onChange={changeField} required />
            {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label" htmlFor="product-category">Category</label>
            <select id="product-category" className={`form-select${fieldErrors.categoryId ? ' is-invalid' : ''}`} name="categoryId" value={form.categoryId} onChange={changeField} required>
              <option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {fieldErrors.categoryId && <div className="invalid-feedback">{fieldErrors.categoryId}</div>}
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="product-description">Description</label>
            <textarea id="product-description" className={`form-control${fieldErrors.description ? ' is-invalid' : ''}`} name="description" rows="5" maxLength="2000" value={form.description} onChange={changeField} required />
            {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="product-price">Price (INR)</label>
            <input id="product-price" className={`form-control${fieldErrors.price ? ' is-invalid' : ''}`} type="number" name="price" min="0.01" step="0.01" value={form.price} onChange={changeField} required />
            {fieldErrors.price && <div className="invalid-feedback">{fieldErrors.price}</div>}
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="product-stock">Stock quantity</label>
            <input id="product-stock" className={`form-control${fieldErrors.stockQuantity ? ' is-invalid' : ''}`} type="number" name="stockQuantity" min="0" step="1" value={form.stockQuantity} onChange={changeField} required />
            {fieldErrors.stockQuantity && <div className="invalid-feedback">{fieldErrors.stockQuantity}</div>}
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="product-image">Product image</label>
            <input id="product-image" className={`form-control${fieldErrors.image ? ' is-invalid' : ''}`} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={changeImage} />
            <div className="form-text">JPG, PNG, or WebP. Maximum size 2 MB. The image uploads after the product is saved.</div>
            {fieldErrors.image && <div className="invalid-feedback d-block">{fieldErrors.image}</div>}
            {(previewUrl || product?.imageUrl) && <div className="admin-image-preview"><ProductImage src={previewUrl || product.imageUrl} alt="Product preview" className="admin-image-preview-img" /><span>{previewUrl ? 'Selected image preview' : 'Current image'}</span></div>}
          </div>
          <div className="col-12 d-flex flex-wrap gap-2 pt-2">
            <button className="btn btn-primary" type="submit" disabled={saving || categories.length === 0}>{saving ? 'Saving...' : isEditing ? 'Save changes' : savedId ? 'Finish product' : 'Create product'}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/admin/products')} disabled={saving}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
