import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../api/adminApi.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Loader from '../../components/Loader.jsx';
import formatCurrency from '../../utils/formatCurrency.js';
import { getApiError } from '../../utils/apiError.js';

const ORDER_STATUSES = ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.getDashboard({ signal });
      setDashboard(data);
    } catch (requestError) {
      if (!signal.aborted) setError(getApiError(requestError, 'Could not load the dashboard.').message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, retry]);

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="section-eyebrow">Overview</span><h2>Dashboard</h2></div></div>
      {loading && <Loader label="Loading dashboard..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setRetry((value) => value + 1)} />}
      {!loading && !error && dashboard && (
        <>
          <section className="row g-3 mb-4" aria-label="Store totals">
            <div className="col-12 col-md-4"><article className="admin-stat-card"><span>Total users</span><strong>{dashboard.totalUsers}</strong></article></div>
            <div className="col-12 col-md-4"><article className="admin-stat-card"><span>Total orders</span><strong>{dashboard.totalOrders}</strong></article></div>
            <div className="col-12 col-md-4"><article className="admin-stat-card"><span>Total revenue</span><strong>{formatCurrency(dashboard.totalRevenue)}</strong></article></div>
          </section>

          <section className="admin-panel mb-4">
            <div className="admin-panel-heading"><h3>Orders by status</h3></div>
            <div className="row g-3">
              {ORDER_STATUSES.map((status) => (
                <div className="col-6 col-lg" key={status}>
                  <div className="admin-status-count"><span>{status}</span><strong>{dashboard.ordersByStatus?.[status] ?? 0}</strong></div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h3>Low stock products</h3><span>Fewer than 5 units</span></div>
            {!dashboard.lowStockProducts?.length ? <p className="admin-empty mb-0">No products are running low on stock.</p> : (
              <div className="table-responsive">
                <table className="table align-middle admin-table mb-0">
                  <thead><tr><th>Product</th><th>Stock</th><th className="text-end">Action</th></tr></thead>
                  <tbody>{dashboard.lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td><td><span className="badge text-bg-warning">{product.stock}</span></td>
                      <td className="text-end"><Link className="btn btn-sm btn-outline-primary" to={`/admin/products/${product.id}/edit`}>Edit product</Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
