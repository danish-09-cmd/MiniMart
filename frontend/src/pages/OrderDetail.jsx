import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import orderApi from '../api/orderApi.js';
import paymentApi from '../api/paymentApi.js';
import { LOGOUT_EVENT } from '../api/axiosClient.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import { getApiError } from '../utils/apiError.js';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function canPay(order) {
  return order?.status === 'PLACED'
    && ['PENDING', 'FAILED'].includes(order.paymentStatus)
    && order.paymentMethod !== 'COD';
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardError, setCardError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paying, setPaying] = useState(false);
  const requestId = useRef(0);
  const paymentLock = useRef(false);
  const actionLock = useRef(false);

  const loadOrder = useCallback(async () => {
    const request = ++requestId.current;
    setOrder(null);
    setLoading(true);
    setErrorMessage('');
    setNotFound(false);
    try {
      const { data } = await orderApi.getOrder(id);
      if (request !== requestId.current) return null;
      setOrder(data);
      if (data.paymentMethod === 'UPI') setPaymentMethod('UPI');
      else if (data.paymentMethod === 'CARD') setPaymentMethod('CARD');
      return data;
    } catch (error) {
      if (request !== requestId.current) return null;
      if (error.response?.status === 404) {
        setOrder(null);
        setNotFound(true);
      } else {
        setErrorMessage(getApiError(error, 'Could not load this order.').message);
      }
      return null;
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [id, retryCount]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const clearOrderAndPaymentState = () => {
      requestId.current += 1;
      setOrder(null);
      setLoading(false);
      setNotFound(false);
      setErrorMessage('');
      setPaymentOpen(false);
      setPaymentMethod('CARD');
      setCardNumber('');
      setCardError('');
      setPaymentError('');
      setCancelling(false);
      setPaying(false);
      paymentLock.current = false;
      actionLock.current = false;
    };
    window.addEventListener(LOGOUT_EVENT, clearOrderAndPaymentState);
    return () => window.removeEventListener(LOGOUT_EVENT, clearOrderAndPaymentState);
  }, []);

  const handleCancel = async () => {
    if (!order || actionLock.current || !window.confirm('Cancel this order? The purchased stock will be returned.')) return;
    actionLock.current = true;
    setCancelling(true);
    setErrorMessage('');
    try {
      await orderApi.cancelOrder(order.id);
      await loadOrder();
      toast.success('Order cancelled. Stock has been restored.');
    } catch (error) {
      const message = getApiError(error, 'Could not cancel this order.').message;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      actionLock.current = false;
      setCancelling(false);
    }
  };

  const openPayment = () => {
    setPaymentError('');
    setCardError('');
    setCardNumber('');
    setPaymentMethod(order?.paymentMethod === 'UPI' ? 'UPI' : 'CARD');
    setPaymentOpen(true);
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!order || paymentLock.current || !canPay(order)) return;
    if (paymentMethod === 'CARD' && !/^\d{12,19}$/.test(cardNumber)) {
      setCardError('Enter a card number containing 12 to 19 digits.');
      return;
    }

    paymentLock.current = true;
    setPaying(true);
    setCardNumber('');
    setCardError('');
    setPaymentError('');
    try {
      const request = { orderId: order.id, method: paymentMethod };
      if (paymentMethod === 'CARD') request.cardNumber = cardNumber;
      const { data } = await paymentApi.mockPayment(request);
      if (data.paymentStatus === 'SUCCESS') toast.success(data.message || 'Payment successful.');
      else {
        setPaymentError(data.message || 'Payment failed. You can retry with another method.');
        toast.error(data.message || 'Payment failed.');
      }
      await loadOrder();
    } catch (error) {
      const message = getApiError(error, 'Payment could not be completed.').message;
      setPaymentError(message);
      toast.error(message);
      await loadOrder();
    } finally {
      paymentLock.current = false;
      setPaying(false);
    }
  };

  if (loading && !order && !notFound) return <div className="container"><Loader label="Loading order..." /></div>;

  if (notFound) {
    return (
      <section className="container order-not-found py-5 text-center">
        <span className="not-found-code">404</span>
        <h1>Order not found</h1>
        <p>This order may not exist or may not belong to your account.</p>
        <Link className="btn btn-primary" to="/orders">Back to your orders</Link>
      </section>
    );
  }

  if (errorMessage && !order) {
    return <section className="container order-detail-page py-5"><ErrorMessage message={errorMessage} onRetry={() => setRetryCount((count) => count + 1)} /></section>;
  }
  if (!order) return null;

  const address = order.address || {};

  return (
    <section className="container order-detail-page py-4 py-lg-5">
      <Link className="checkout-back-link" to="/orders">Back to orders</Link>
      {errorMessage && <div className="mt-3"><ErrorMessage message={errorMessage} onRetry={() => setRetryCount((count) => count + 1)} /></div>}
      <div className="order-detail-heading">
        <div>
          <span className="section-eyebrow">Placed {formatDate(order.createdAt)}</span>
          <h1>Order #{order.id}</h1>
        </div>
        <div className="order-badges">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-8">
          <section className="order-detail-card">
            <h2>Items in this order</h2>
            <div className="order-detail-items">
              {(order.items || []).map((item, index) => (
                <article className="order-detail-item" key={`${item.productId}-${index}`}>
                  <ProductImage className="order-detail-item-image" src={item.imageUrl} alt={item.name} />
                  <div className="order-detail-item-info">
                    <h3>{item.name}</h3>
                    <span>{item.quantity} × {formatCurrency(item.unitPrice)} at purchase</span>
                  </div>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="order-detail-card order-address-card">
            <h2>Delivery address</h2>
            <strong>{address.fullName}</strong>
            <span>{address.phone}</span>
            <address>
              {address.line1}{address.line2 && <><br />{address.line2}</>}<br />
              {address.city}, {address.state} {address.pincode}
            </address>
          </section>
        </div>

        <aside className="col-12 col-lg-4">
          <section className="order-summary-card">
            <h2>Order summary</h2>
            <div className="order-summary-row"><span>Order status</span><StatusBadge status={order.status} /></div>
            <div className="order-summary-row"><span>Payment status</span><StatusBadge status={order.paymentStatus} /></div>
            <div className="order-summary-row"><span>Payment method</span><strong>{order.paymentMethod || 'Not selected'}</strong></div>
            <div className="order-summary-total"><span>Total</span><strong>{formatCurrency(order.totalAmount)}</strong></div>

            {order.status === 'PLACED' && (
              <button className="btn btn-outline-danger w-100 order-action-button" type="button" onClick={handleCancel} disabled={cancelling || paying}>
                {cancelling ? 'Cancelling...' : 'Cancel order'}
              </button>
            )}
            {canPay(order) && !paymentOpen && (
              <button className="btn btn-primary w-100 order-action-button" type="button" onClick={openPayment} disabled={cancelling || paying}>Pay now</button>
            )}
            {paymentOpen && canPay(order) && (
              <form className="order-pay-panel" onSubmit={submitPayment}>
                <h3>Retry payment for this order</h3>
                {paymentError && <ErrorMessage message={paymentError} />}
                <div className="payment-method-options">
                  {['CARD', 'UPI'].map((method) => (
                    <label className={`payment-method-option${paymentMethod === method ? ' selected' : ''}`} key={method}>
                      <input type="radio" name="order-payment-method" value={method} checked={paymentMethod === method} onChange={() => { setPaymentMethod(method); setCardError(''); }} disabled={paying} />
                      <span><strong>{method === 'CARD' ? 'Card' : 'UPI'}</strong><small>{method === 'CARD' ? 'Mock card payment' : 'Mock UPI payment'}</small></span>
                    </label>
                  ))}
                </div>
                {paymentMethod === 'CARD' && (
                  <div className="mt-3">
                    <label className="form-label" htmlFor="order-card-number">Card number</label>
                    <input
                      id="order-card-number"
                      className={`form-control checkout-card-input${cardError ? ' is-invalid' : ''}`}
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(event) => { setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 19)); setCardError(''); }}
                      disabled={paying}
                      aria-invalid={Boolean(cardError)}
                    />
                    {cardError && <div className="invalid-feedback">{cardError}</div>}
                  </div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary flex-grow-1" type="submit" disabled={paying}>{paying ? 'Processing...' : 'Pay now'}</button>
                  <button className="btn btn-outline-secondary" type="button" onClick={() => { setPaymentOpen(false); setCardNumber(''); setPaymentError(''); }} disabled={paying}>Close</button>
                </div>
              </form>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
