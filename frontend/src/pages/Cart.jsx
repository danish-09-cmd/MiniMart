import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import { getApiError } from '../utils/apiError.js';

export default function Cart() {
  const {
    items,
    grandTotal,
    totalItems,
    loading,
    error,
    pendingItems,
    clearing,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  } = useCart();
  const [rowErrors, setRowErrors] = useState({});

  const handleQuantityChange = async (item, quantity) => {
    const id = String(item.productId);
    setRowErrors((current) => ({ ...current, [id]: '' }));
    try {
      await updateQuantity(item.productId, quantity);
    } catch (requestError) {
      setRowErrors((current) => ({
        ...current,
        [id]: getApiError(requestError, 'Could not update this quantity.').message,
      }));
    }
  };

  const handleRemove = async (item) => {
    const id = String(item.productId);
    setRowErrors((current) => ({ ...current, [id]: '' }));
    try {
      await removeItem(item.productId);
    } catch (requestError) {
      setRowErrors((current) => ({
        ...current,
        [id]: getApiError(requestError, 'Could not remove this item.').message,
      }));
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    try {
      await clearCart();
      setRowErrors({});
    } catch {
      // The context displays the backend error in a toast and the error banner.
    }
  };

  if (loading && items.length === 0) return <div className="container"><Loader label="Loading your cart..." /></div>;

  return (
    <section className="container cart-page py-4 py-lg-5">
      <div className="cart-heading">
        <div>
          <span className="section-eyebrow">Your basket</span>
          <h1>Shopping cart</h1>
          <p>{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        {items.length > 0 && (
          <button className="btn btn-outline-secondary" type="button" onClick={handleClear} disabled={clearing || Object.keys(pendingItems).length > 0}>
            {clearing ? 'Clearing...' : 'Clear cart'}
          </button>
        )}
      </div>

      {error && <div className="mb-3"><ErrorMessage message={error} onRetry={() => refreshCart().catch(() => {})} /></div>}

      {items.length === 0 && !error ? (
        <div className="cart-empty-state">
          <span className="empty-basket" aria-hidden="true">+</span>
          <h2>Your cart is empty</h2>
          <p>Find something useful for your everyday routine.</p>
          <Link className="btn btn-primary" to="/">Continue shopping</Link>
        </div>
      ) : items.length > 0 ? (
        <div className="row g-4 align-items-start">
          <div className="col-12 col-lg-8">
            <div className="cart-items-list">
              {items.map((item) => {
                const id = String(item.productId);
                const rowPending = Boolean(pendingItems[id]) || clearing;
                const stockLimit = item.stockQuantity !== null && item.stockQuantity !== undefined && Number.isFinite(Number(item.stockQuantity))
                  ? Number(item.stockQuantity)
                  : null;
                const atStockLimit = stockLimit !== null && Number(item.quantity) >= stockLimit;
                return (
                  <article className={`cart-item-card${rowPending ? ' cart-item-pending' : ''}`} key={id}>
                    <ProductImage className="cart-item-image" src={item.imageUrl} alt={item.name} />
                    <div className="cart-item-info">
                      <h2>{item.name}</h2>
                      <span className="cart-unit-price">{formatCurrency(item.unitPrice)} <span>each</span></span>
                      <div className="cart-item-actions">
                        <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => handleQuantityChange(item, Number(item.quantity) - 1)} disabled={rowPending || Number(item.quantity) <= 1}>-</button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => handleQuantityChange(item, Number(item.quantity) + 1)} disabled={rowPending || (atStockLimit && Number(item.quantity) >= stockLimit)}>+</button>
                        </div>
                        <button className="cart-remove-button" type="button" onClick={() => handleRemove(item)} disabled={rowPending}>Remove</button>
                      </div>
                      {rowErrors[id] && <div className="cart-row-error" role="alert">{rowErrors[id]}</div>}
                    </div>
                    <strong className="cart-line-total">{formatCurrency(item.lineTotal)}</strong>
                    {rowPending && <span className="visually-hidden" role="status">Updating {item.name}</span>}
                  </article>
                );
              })}
            </div>
            <Link className="cart-continue-link" to="/">Continue shopping</Link>
          </div>
          <aside className="col-12 col-lg-4">
            <div className="cart-summary-card">
              <h2>Order summary</h2>
              <div className="cart-summary-row"><span>Items</span><span>{totalItems}</span></div>
              <div className="cart-summary-row cart-grand-total"><span>Grand total</span><strong>{formatCurrency(grandTotal)}</strong></div>
              <Link className="btn btn-primary w-100 cart-checkout-button" to="/checkout">Proceed to Checkout</Link>
              <p className="cart-summary-note">Shipping and final order details are confirmed at checkout.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
