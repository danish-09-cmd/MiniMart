import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Loader from '../../components/Loader.jsx';
import Pagination from '../../components/Pagination.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import formatCurrency from '../../utils/formatCurrency.js';
import { getApiError } from '../../utils/apiError.js';

const PAGE_SIZE = 10;
const STATUSES = ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function nextStatuses(status) {
  if (status === 'PLACED' || status === 'PAID') return ['SHIPPED'];
  if (status === 'SHIPPED') return ['DELIVERED'];
  return [];
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function OrderDetails({ order, onClose, onStatusChange, pending }) {
  const validNext = nextStatuses(order.status);
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="admin-order-modal-title">
        <div className="admin-modal-heading"><div><span className="section-eyebrow">Order #{order.id}</span><h3 id="admin-order-modal-title">Order details</h3></div><button className="btn-close" type="button" aria-label="Close" onClick={onClose} /></div>
        <div className="admin-order-customer mb-3"><strong>{order.customerName || 'Customer'}</strong><span>{order.customerEmail || 'No email available'}</span><span>{displayDate(order.createdAt)}</span></div>
        <div className="d-flex flex-wrap gap-2 mb-3"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /><span className="badge text-bg-light">{order.paymentMethod}</span></div>
        <div className="admin-order-lines">
          {(order.items || []).map((item) => <div className="admin-order-line" key={`${item.productId}-${item.name}`}><ProductImage src={item.imageUrl} alt="" className="admin-order-line-image" /><div><strong>{item.name}</strong><span>{item.quantity} × {formatCurrency(item.unitPrice)}</span></div><b>{formatCurrency(item.lineTotal)}</b></div>)}
        </div>
        <div className="admin-order-address"><h4>Shipping address</h4><p>{order.address?.fullName}<br />{order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}<br />{order.address?.city}, {order.address?.state} {order.address?.pincode}<br />{order.address?.phone}</p></div>
        <div className="admin-order-total"><span>Order total</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
        {validNext.length > 0 && <div className="admin-status-actions"><span>Next valid status</span>{validNext.map((status) => <button key={status} className="btn btn-primary" type="button" onClick={() => onStatusChange(status)} disabled={pending}>{pending ? 'Updating...' : `Mark ${status.toLowerCase()}`}</button>)}</div>}
        {!validNext.length && <p className="admin-muted mb-0">This order has no further status transitions.</p>}
      </section>
    </div>
  );
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const status = STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : '';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    adminApi.getAdminOrders({ page: page - 1, size: PAGE_SIZE, status: status || undefined }, { signal: controller.signal })
      .then(({ data }) => setResult(data))
      .catch((requestError) => { if (!controller.signal.aborted) setError(getApiError(requestError, 'Could not load orders.').message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, retry]);

  const changeQuery = (changes) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    for (const [key, value] of Object.entries(changes)) {
      if (!value) next.delete(key);
      else next.set(key, String(value));
    }
    return next;
  });

  const openOrder = useCallback(async (id) => {
    setPending(true);
    try {
      const { data } = await adminApi.getAdminOrder(id);
      setSelected(data);
    } catch (requestError) {
      toast.error(getApiError(requestError, 'Could not load order details.').message);
    } finally {
      setPending(false);
    }
  }, []);

  const changeStatus = useCallback(async (nextStatus) => {
    if (!selected) return;
    setPending(true);
    try {
      await adminApi.updateOrderStatus(selected.id, nextStatus);
      const { data } = await adminApi.getAdminOrder(selected.id);
      setSelected(data);
      setRetry((value) => value + 1);
      toast.success(`Order #${selected.id} moved to ${nextStatus.toLowerCase()}.`);
    } catch (requestError) {
      toast.error(getApiError(requestError, 'Could not update the order status.').message);
    } finally {
      setPending(false);
    }
  }, [selected]);

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="section-eyebrow">Fulfillment</span><h2>Orders</h2></div><div className="admin-order-filter"><label className="visually-hidden" htmlFor="admin-order-status">Filter by status</label><select id="admin-order-status" className="form-select" value={status} onChange={(event) => changeQuery({ status: event.target.value || null, page: 1 })}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
      {loading && <Loader label="Loading orders..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setRetry((value) => value + 1)} />}
      {!loading && !error && result?.content?.length === 0 && <div className="admin-empty"><h3>No orders found</h3><p>Orders matching this filter will appear here.</p></div>}
      {!loading && !error && result?.content?.length > 0 && <>
        <div className="table-responsive admin-panel p-0"><table className="table align-middle admin-table mb-0"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th className="text-end">Details</th></tr></thead><tbody>
          {result.content.map((order) => <tr key={order.id}><td>#{order.id}</td><td><span className="d-block">{order.customerName || 'Customer'}</span><small className="text-secondary">{order.customerEmail}</small></td><td>{displayDate(order.createdAt)}</td><td>{formatCurrency(order.totalAmount)}</td><td><StatusBadge status={order.status} /></td><td><StatusBadge status={order.paymentStatus} /></td><td className="text-end"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => openOrder(order.id)} disabled={pending}>View order</button></td></tr>)}
        </tbody></table></div>
        <Pagination currentPage={page} totalPages={result.totalPages} onPageChange={(nextPage) => changeQuery({ page: nextPage })} />
      </>}
      {selected && <OrderDetails order={selected} onClose={() => setSelected(null)} onStatusChange={changeStatus} pending={pending} />}
    </div>
  );
}
