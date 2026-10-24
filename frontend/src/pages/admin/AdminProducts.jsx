import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Loader from '../../components/Loader.jsx';
import Pagination from '../../components/Pagination.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import formatCurrency from '../../utils/formatCurrency.js';
import { getApiError } from '../../utils/apiError.js';

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const keyword = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keyword);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [pendingId, setPendingId] = useState(null);
  const requestId = useRef(0);
  const query = useMemo(() => `${page}:${keyword}`, [page, keyword]);

  useEffect(() => setSearchInput(keyword), [keyword]);
  useEffect(() => {
    if (searchInput.trim() === keyword) return undefined;
    const timer = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const value = searchInput.trim();
        if (value) next.set('keyword', value);
        else next.delete('keyword');
        next.set('page', '1');
        return next;
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, keyword, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    adminApi.getAdminProducts({ page: page - 1, size: PAGE_SIZE, keyword: keyword || undefined, sortBy: 'createdAt', sortDir: 'desc' }, { signal: controller.signal })
      .then(({ data }) => {
        if (requestId.current === currentRequest) setResult({ query, data });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestId.current === currentRequest) setError(getApiError(requestError, 'Could not load products.').message);
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId.current === currentRequest) setLoading(false);
      });
    return () => controller.abort();
  }, [page, keyword, query, retry]);

  const changePage = (nextPage) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    next.set('page', String(nextPage));
    return next;
  });

  const deactivate = useCallback(async (product) => {
    if (!window.confirm(`Deactivate “${product.name}”? It will no longer appear in the public catalog.`)) return;
    setPendingId(product.id);
    try {
      await adminApi.deleteProduct(product.id);
      toast.success('Product deactivated.');
      setRetry((value) => value + 1);
    } catch (requestError) {
      toast.error(getApiError(requestError, 'Could not deactivate this product.').message);
    } finally {
      setPendingId(null);
    }
  }, []);

  const current = result?.query === query ? result.data : null;
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="section-eyebrow">Catalog</span><h2>Products</h2></div><Link to="/admin/products/new" className="btn btn-primary">Add product</Link></div>
      <div className="admin-toolbar"><label className="visually-hidden" htmlFor="admin-product-search">Search products</label><input id="admin-product-search" className="form-control" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products by name" /></div>
      {loading && <Loader label="Loading products..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setRetry((value) => value + 1)} />}
      {!loading && !error && current && current.content.length === 0 && <div className="admin-empty"><h3>No products found</h3><p>Try another keyword or add a product.</p></div>}
      {!loading && !error && current?.content?.length > 0 && (
        <>
          <div className="table-responsive admin-panel p-0">
            <table className="table align-middle admin-table mb-0">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>{current.content.map((product) => (
                <tr key={product.id}>
                  <td><div className="admin-product-cell"><ProductImage src={product.imageUrl} alt="" className="admin-product-thumb" /><span>{product.name}</span></div></td>
                  <td>{product.categoryName}</td><td>{formatCurrency(product.price)}</td><td>{product.stockQuantity}</td>
                  <td><span className={`badge ${product.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{product.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="text-end text-nowrap"><Link className="btn btn-sm btn-outline-primary me-2" to={`/admin/products/${product.id}/edit`} state={{ product }}>Edit</Link><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deactivate(product)} disabled={!product.active || pendingId === product.id}>{pendingId === product.id ? 'Saving...' : 'Deactivate'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={current.totalPages} onPageChange={changePage} />
        </>
      )}
    </div>
  );
}
