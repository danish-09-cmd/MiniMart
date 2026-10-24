import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import orderApi from '../api/orderApi.js';
import { LOGOUT_EVENT } from '../api/axiosClient.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import { getApiError } from '../utils/apiError.js';

const PAGE_SIZE = 10;

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedPage = Number(searchParams.get('page'));
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const requestId = useRef(0);
  const [retryCount, setRetryCount] = useState(0);

  const loadOrders = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await orderApi.getOrders({ page: currentPage - 1, size: PAGE_SIZE });
      if (request !== requestId.current) return;
      setOrders(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(Number(data?.totalPages) || 0);
      if (Number(data?.totalPages) > 0 && currentPage > Number(data.totalPages)) {
        setSearchParams({ page: String(data.totalPages) }, { replace: true });
      }
    } catch (error) {
      if (request !== requestId.current) return;
      const message = getApiError(error, 'Could not load your orders.').message;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [currentPage, setSearchParams, retryCount]);

  useEffect(() => {
    if (searchParams.get('page') !== String(currentPage)) {
      setSearchParams({ page: String(currentPage) }, { replace: true });
      return;
    }
    loadOrders();
  }, [currentPage, loadOrders, searchParams, setSearchParams]);

  useEffect(() => {
    const clearOrderState = () => {
      requestId.current += 1;
      setOrders([]);
      setTotalPages(0);
      setErrorMessage('');
      setLoading(false);
    };
    window.addEventListener(LOGOUT_EVENT, clearOrderState);
    return () => window.removeEventListener(LOGOUT_EVENT, clearOrderState);
  }, []);

  const changePage = (nextPage) => {
    setSearchParams({ page: String(nextPage) });
  };

  return (
    <section className="container orders-page py-4 py-lg-5">
      <div className="orders-heading">
        <div>
          <span className="section-eyebrow">Your purchases</span>
          <h1>Order history</h1>
          <p>Track your recent orders and payment status.</p>
        </div>
        <Link className="btn btn-outline-primary" to="/">Continue shopping</Link>
      </div>

      {errorMessage && <div className="mb-3"><ErrorMessage message={errorMessage} onRetry={() => setRetryCount((count) => count + 1)} /></div>}
      {loading && <Loader label="Loading your orders..." />}

      {!loading && !errorMessage && orders.length === 0 && (
        <div className="orders-empty-state">
          <span className="empty-basket" aria-hidden="true">+</span>
          <h2>No orders yet</h2>
          <p>Your completed and recent purchases will appear here.</p>
          <Link className="btn btn-primary" to="/">Start shopping</Link>
        </div>
      )}

      {!loading && !errorMessage && orders.length > 0 && (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-list-card" key={order.id}>
                <div className="order-list-main">
                  <div>
                    <span className="order-list-label">Order</span>
                    <h2><Link to={`/orders/${order.id}`}>#{order.id}</Link></h2>
                    <time className="order-date" dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                  </div>
                  <div className="order-list-total">
                    <span className="order-list-label">Total</span>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>
                </div>
                <div className="order-list-footer">
                  <div className="order-badges">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                  <Link className="order-details-link" to={`/orders/${order.id}`}>View order</Link>
                </div>
              </article>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} />
        </>
      )}
    </section>
  );
}
