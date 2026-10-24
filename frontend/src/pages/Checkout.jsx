import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import addressApi from '../api/addressApi.js';
import orderApi from '../api/orderApi.js';
import paymentApi from '../api/paymentApi.js';
import { LOGOUT_EVENT } from '../api/axiosClient.js';
import AddressForm from '../components/AddressForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useCart } from '../context/CartContext.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import { getApiError } from '../utils/apiError.js';

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Card', detail: 'Use a mock card payment.' },
  { value: 'UPI', label: 'UPI', detail: 'Complete a simulated UPI payment.' },
  { value: 'COD', label: 'Cash on delivery', detail: 'Pay when your order is delivered.' },
];

function validateCard(number) {
  return /^\d{12,19}$/.test(number);
}

export default function Checkout() {
  const {
    items,
    grandTotal,
    totalItems,
    loading: cartLoading,
    error: cartError,
    refreshCart,
  } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardError, setCardError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paying, setPaying] = useState(false);
  const addressesRequestId = useRef(0);
  const orderLock = useRef(false);
  const paymentLock = useRef(false);

  const loadAddresses = useCallback(async (preferredId = null) => {
    const request = ++addressesRequestId.current;
    setAddressesLoading(true);
    setAddressesError('');
    try {
      const { data } = await addressApi.getAddresses();
      if (request !== addressesRequestId.current) return;
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      setSelectedAddressId((current) => {
        if (preferredId !== null && list.some((address) => String(address.id) === String(preferredId))) return String(preferredId);
        if (current && current !== 'new' && list.some((address) => String(address.id) === current)) return current;
        const defaultAddress = list.find((address) => address.defaultAddress) || list[0];
        return defaultAddress ? String(defaultAddress.id) : 'new';
      });
      setShowAddressForm(list.length === 0);
    } catch (error) {
      if (request === addressesRequestId.current) {
        setAddressesError(getApiError(error, 'Could not load your saved addresses.').message);
      }
    } finally {
      if (request === addressesRequestId.current) setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const clearCheckoutState = () => {
      addressesRequestId.current += 1;
      setAddresses([]);
      setSelectedAddressId('');
      setCardNumber('');
      setCardError('');
      setCreatedOrder(null);
      setPaymentState('idle');
      setPaymentError('');
      setOrderError('');
      setShowAddressForm(false);
      orderLock.current = false;
      paymentLock.current = false;
    };
    window.addEventListener(LOGOUT_EVENT, clearCheckoutState);
    return () => window.removeEventListener(LOGOUT_EVENT, clearCheckoutState);
  }, []);

  const saveCheckoutAddress = async (details) => {
    const { data } = await addressApi.createAddress(details);
    toast.success('Address added.');
    setShowAddressForm(false);
    await loadAddresses(data?.id);
  };

  const attemptPayment = async (orderId, method, enteredCardNumber) => {
    if (paymentLock.current) return;
    if (method === 'CARD' && !validateCard(enteredCardNumber)) {
      setCardError('Enter a card number containing 12 to 19 digits.');
      return;
    }

    paymentLock.current = true;
    setPaying(true);
    setPaymentError('');
    setCardError('');
    setCardNumber('');
    setPaymentState('processing');
    try {
      const request = { orderId, method };
      if (method === 'CARD') request.cardNumber = enteredCardNumber;
      const { data } = await paymentApi.mockPayment(request);
      if (data.paymentStatus === 'SUCCESS') {
        setPaymentState('success');
        toast.success(data.message || 'Payment successful.');
      } else if (method === 'COD') {
        setPaymentState('cod');
        toast.success('Order placed, pay on delivery.');
      } else {
        setPaymentState('failed');
        setPaymentError(data.message || 'Payment failed. Retry with another payment method.');
        toast.error(data.message || 'Payment failed.');
      }
    } catch (error) {
      const message = getApiError(error, 'Payment could not be completed. Your order is saved and can be paid again.').message;
      setPaymentState('failed');
      setPaymentError(message);
      toast.error(message);
    } finally {
      paymentLock.current = false;
      setPaying(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (orderLock.current || createdOrder) return;
    if (!selectedAddressId || selectedAddressId === 'new') {
      setOrderError('Choose or add a delivery address before placing your order.');
      return;
    }
    if (paymentMethod === 'CARD' && !validateCard(cardNumber)) {
      setCardError('Enter a card number containing 12 to 19 digits.');
      return;
    }

    const submittedMethod = paymentMethod;
    const submittedCardNumber = cardNumber;
    orderLock.current = true;
    setPlacingOrder(true);
    setOrderError('');
    setCardError('');
    setCardNumber('');
    try {
      const { data: order } = await orderApi.placeOrder(Number(selectedAddressId));
      setCreatedOrder(order);
      setPaymentState('processing');
      try {
        await refreshCart();
      } catch {
        // The order was created; continue to payment with that same order ID.
      }
      await attemptPayment(order.id, submittedMethod, submittedCardNumber);
    } catch (error) {
      const message = getApiError(error, 'Could not place your order.').message;
      setOrderError(message);
      toast.error(message);
    } finally {
      orderLock.current = false;
      setPlacingOrder(false);
    }
  };

  const retryPayment = () => {
    if (!createdOrder) return;
    attemptPayment(createdOrder.id, paymentMethod, cardNumber);
  };

  if (cartLoading && !createdOrder) return <div className="container"><Loader label="Preparing checkout..." /></div>;
  if (cartError && !createdOrder && items.length === 0) {
    return <section className="container checkout-page py-5"><ErrorMessage message={cartError} onRetry={() => refreshCart().catch(() => {})} /></section>;
  }
  if (!createdOrder && items.length === 0) return <Navigate to="/cart" replace />;

  if (createdOrder) {
    const total = createdOrder.totalAmount ?? grandTotal;
    return (
      <section className="container checkout-page py-4 py-lg-5">
        <div className="checkout-result-card">
          <span className="section-eyebrow">Order #{createdOrder.id}</span>
          {paymentState === 'success' ? (
            <>
              <div className="checkout-result-icon checkout-result-success" aria-hidden="true">✓</div>
              <h1>Order confirmed</h1>
              <p>Your payment was successful. We have received your order.</p>
              <div className="checkout-confirmation-summary">
                <span>Order total</span><strong>{formatCurrency(total)}</strong>
              </div>
              <StatusBadge status="SUCCESS" />
            </>
          ) : paymentState === 'cod' ? (
            <>
              <div className="checkout-result-icon checkout-result-success" aria-hidden="true">✓</div>
              <h1>Order placed, pay on delivery</h1>
              <p>Your order is confirmed. Payment is due when it is delivered.</p>
              <div className="checkout-confirmation-summary">
                <span>Order total</span><strong>{formatCurrency(total)}</strong>
              </div>
              <StatusBadge status="PENDING" />
            </>
          ) : (
            <>
              <div className={`checkout-result-icon${paymentState === 'failed' ? ' checkout-result-failed' : ''}`} aria-hidden="true">
                {paymentState === 'processing' ? <span className="spinner-border spinner-border-sm" /> : '!' }
              </div>
              <h1>{paymentState === 'processing' ? 'Completing your order' : 'Payment needs another try'}</h1>
              <p>{paymentError || 'Your order is saved. You can retry payment without placing another order.'}</p>
              {orderError && <ErrorMessage message={orderError} />}
              <div className="checkout-confirmation-summary">
                <span>Order total</span><strong>{formatCurrency(total)}</strong>
              </div>
              {paymentState === 'failed' && (
                <div className="checkout-retry-panel">
                  <fieldset disabled={paying}>
                    <legend>Choose a payment method</legend>
                    <div className="payment-method-options">
                      {PAYMENT_METHODS.map((method) => (
                        <label className={`payment-method-option${paymentMethod === method.value ? ' selected' : ''}`} key={method.value}>
                          <input type="radio" name="retry-payment-method" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} />
                          <span><strong>{method.label}</strong><small>{method.detail}</small></span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {paymentMethod === 'CARD' && (
                    <div className="mt-3">
                      <label className="form-label" htmlFor="retry-card-number">Card number</label>
                      <input
                        id="retry-card-number"
                        className={`form-control checkout-card-input${cardError ? ' is-invalid' : ''}`}
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(event) => { setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 19)); setCardError(''); }}
                        aria-invalid={Boolean(cardError)}
                      />
                      {cardError && <div className="invalid-feedback">{cardError}</div>}
                    </div>
                  )}
                  <button className="btn btn-primary mt-3" type="button" onClick={retryPayment} disabled={paying}>
                    {paying ? 'Processing payment...' : 'Retry payment'}
                  </button>
                </div>
              )}
              {paymentState !== 'processing' && <StatusBadge status={paymentState === 'failed' ? 'FAILED' : 'PENDING'} />}
            </>
          )}
          <div className="checkout-result-actions">
            <Link className="btn btn-outline-primary" to={`/orders/${createdOrder.id}`}>View order</Link>
            <Link className="btn btn-link" to="/orders">Order history</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container checkout-page py-4 py-lg-5">
      <div className="checkout-heading">
        <div>
          <span className="section-eyebrow">Almost there</span>
          <h1>Checkout</h1>
          <p>Confirm your delivery details and payment method.</p>
        </div>
        <Link className="checkout-back-link" to="/cart">Back to cart</Link>
      </div>

      {orderError && <div className="mb-3"><ErrorMessage message={orderError} /></div>}
      {addressesError && <div className="mb-3"><ErrorMessage message={addressesError} onRetry={() => loadAddresses()} /></div>}

      <form onSubmit={placeOrder}>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-lg-7">
            <section className="checkout-section-card">
              <div className="checkout-section-title"><span>1</span><div><h2>Delivery address</h2><p>Where should we send your order?</p></div></div>
              {addressesLoading ? <Loader label="Loading addresses..." /> : addresses.length > 0 ? (
                <>
                  <label className="form-label" htmlFor="checkout-address">Choose an address</label>
                  <select
                    id="checkout-address"
                    className="form-select checkout-address-select"
                    value={selectedAddressId}
                    disabled={placingOrder || paying}
                    onChange={(event) => {
                      setSelectedAddressId(event.target.value);
                      setShowAddressForm(event.target.value === 'new');
                      setOrderError('');
                    }}
                  >
                    {addresses.map((address) => (
                      <option value={String(address.id)} key={address.id}>
                        {address.fullName} - {address.line1}, {address.city}{address.defaultAddress ? ' (Default)' : ''}
                      </option>
                    ))}
                    <option value="new">Add new address...</option>
                  </select>
                </>
              ) : !addressesError ? (
                <div className="alert alert-info mb-3">Add a delivery address to continue with checkout.</div>
              ) : null}
              {showAddressForm && !addressesLoading && (
                <AddressForm
                  key="checkout-new-address"
                  title="Add a delivery address"
                  submitLabel="Save and use this address"
                  disabled={placingOrder || paying}
                  onSubmit={saveCheckoutAddress}
                  onCancel={addresses.length > 0 ? () => {
                    const defaultAddress = addresses.find((address) => address.defaultAddress) || addresses[0];
                    setSelectedAddressId(defaultAddress ? String(defaultAddress.id) : 'new');
                    setShowAddressForm(false);
                  } : undefined}
                />
              )}
            </section>

            <section className="checkout-section-card">
              <div className="checkout-section-title"><span>2</span><div><h2>Review items</h2><p>{totalItems} {totalItems === 1 ? 'item' : 'items'} in your order</p></div></div>
              <div className="checkout-review-list">
                {items.map((item) => (
                  <div className="checkout-review-item" key={item.productId}>
                    <div><strong>{item.name}</strong><span>{item.quantity} × {formatCurrency(item.unitPrice)}</span></div>
                    <strong>{formatCurrency(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              <div className="checkout-review-total"><span>Grand total</span><strong>{formatCurrency(grandTotal)}</strong></div>
            </section>

            <section className="checkout-section-card">
              <div className="checkout-section-title"><span>3</span><div><h2>Payment method</h2><p>Choose how you would like to pay.</p></div></div>
              <div className="payment-method-options">
                {PAYMENT_METHODS.map((method) => (
                  <label className={`payment-method-option${paymentMethod === method.value ? ' selected' : ''}`} key={method.value}>
                          <input type="radio" name="payment-method" value={method.value} checked={paymentMethod === method.value} onChange={() => { setPaymentMethod(method.value); setCardError(''); }} disabled={placingOrder || paying} />
                    <span><strong>{method.label}</strong><small>{method.detail}</small></span>
                  </label>
                ))}
              </div>
              {paymentMethod === 'CARD' && (
                <div className="mt-3">
                  <label className="form-label" htmlFor="checkout-card-number">Card number</label>
                  <input
                    id="checkout-card-number"
                    className={`form-control checkout-card-input${cardError ? ' is-invalid' : ''}`}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={19}
                    value={cardNumber}
                    disabled={placingOrder || paying}
                    onChange={(event) => { setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 19)); setCardError(''); }}
                    aria-invalid={Boolean(cardError)}
                    aria-describedby={cardError ? 'checkout-card-error' : 'checkout-card-help'}
                  />
                  {cardError
                    ? <div className="invalid-feedback" id="checkout-card-error">{cardError}</div>
                    : <div className="form-text" id="checkout-card-help">Mock payment only. The card number is cleared as soon as you submit.</div>}
                </div>
              )}
            </section>
          </div>

          <aside className="col-12 col-lg-5">
            <div className="checkout-place-order-card">
              <h2>Order total</h2>
              <div className="checkout-confirmation-summary"><span>Items</span><span>{totalItems}</span></div>
              <div className="checkout-confirmation-summary"><span>Grand total</span><strong>{formatCurrency(grandTotal)}</strong></div>
              <button className="btn btn-primary w-100 checkout-place-button" type="submit" disabled={placingOrder || paying || addressesLoading || addresses.length === 0 || showAddressForm}>
                {placingOrder || paying ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Placing order...</> : 'Place Order'}
              </button>
              <p>Prices and order totals are confirmed by the server when you place the order.</p>
            </div>
          </aside>
        </div>
      </form>
    </section>
  );
}
