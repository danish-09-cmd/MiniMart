import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import cartApi from '../api/cartApi.js';
import { LOGOUT_EVENT } from '../api/axiosClient.js';
import { useAuth } from './AuthContext.jsx';
import { getApiError } from '../utils/apiError.js';

const CartContext = createContext(null);
const EMPTY_CART = { items: [], grandTotal: 0, totalItems: 0 };

function normalizeCart(cart) {
  return {
    items: Array.isArray(cart?.items) ? cart.items : [],
    grandTotal: Number(cart?.grandTotal) || 0,
    totalItems: Number(cart?.totalItems) || 0,
  };
}

export function CartProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingItems, setPendingItems] = useState({});
  const [clearing, setClearing] = useState(false);
  const requestId = useRef(0);

  const refreshCart = useCallback(async () => {
    if (!user) {
      requestId.current += 1;
      setCart(EMPTY_CART);
      setError('');
      setLoading(false);
      return EMPTY_CART;
    }

    const request = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await cartApi.getCart();
      if (request === requestId.current) setCart(normalizeCart(data));
      return normalizeCart(data);
    } catch (requestError) {
      if (request === requestId.current) {
        const result = getApiError(requestError, 'Could not load your cart.');
        setError(result.message);
        toast.error(result.message);
      }
      throw requestError;
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (user) {
      refreshCart().catch(() => {});
    } else {
      requestId.current += 1;
      setCart(EMPTY_CART);
      setError('');
      setLoading(false);
      setPendingItems({});
    }
    return undefined;
  }, [authLoading, user, refreshCart]);

  useEffect(() => {
    const clearOnLogout = () => {
      requestId.current += 1;
      setCart(EMPTY_CART);
      setError('');
      setLoading(false);
      setPendingItems({});
      setClearing(false);
    };
    window.addEventListener(LOGOUT_EVENT, clearOnLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, clearOnLogout);
  }, []);

  const setItemPending = useCallback((productId, pending) => {
    const key = String(productId);
    setPendingItems((current) => {
      const next = { ...current };
      if (pending) next[key] = true;
      else delete next[key];
      return next;
    });
  }, []);

  const runItemAction = useCallback(async (productId, requestAction, successMessage) => {
    setItemPending(productId, true);
    setError('');
    try {
      const response = await requestAction();
      if (response?.data) {
        requestId.current += 1;
        setCart(normalizeCart(response.data));
      }
      toast.success(successMessage);
      return response;
    } catch (requestError) {
      const result = getApiError(requestError, 'Could not update your cart.');
      setError(result.message);
      toast.error(result.message);
      throw requestError;
    } finally {
      setItemPending(productId, false);
    }
  }, [setItemPending]);

  const addToCart = useCallback((productId, quantity = 1) => (
    runItemAction(productId, () => cartApi.addItem(productId, quantity), 'Added to your cart.')
  ), [runItemAction]);

  const updateQuantity = useCallback((productId, quantity) => (
    runItemAction(productId, () => cartApi.updateItem(productId, quantity), quantity === 0 ? 'Item removed from your cart.' : 'Cart quantity updated.')
  ), [runItemAction]);

  const removeItem = useCallback(async (productId) => {
    setItemPending(productId, true);
    setError('');
    try {
      await cartApi.removeItem(productId);
      requestId.current += 1;
      setCart((current) => {
        const items = current.items.filter((item) => String(item.productId) !== String(productId));
        const grandTotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
        const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return {
          items,
          grandTotal: Number(grandTotal.toFixed(2)),
          totalItems,
        };
      });
      toast.success('Item removed from your cart.');
    } catch (requestError) {
      const result = getApiError(requestError, 'Could not remove this item.');
      setError(result.message);
      toast.error(result.message);
      throw requestError;
    } finally {
      setItemPending(productId, false);
    }
  }, [setItemPending]);

  const clearCart = useCallback(async () => {
    setClearing(true);
    setError('');
    try {
      await cartApi.clearCart();
      requestId.current += 1;
      setCart(EMPTY_CART);
      toast.success('Cart cleared.');
    } catch (requestError) {
      const result = getApiError(requestError, 'Could not clear your cart.');
      setError(result.message);
      toast.error(result.message);
      throw requestError;
    } finally {
      setClearing(false);
    }
  }, []);

  const value = useMemo(() => ({
    items: cart.items,
    grandTotal: cart.grandTotal,
    totalItems: cart.totalItems,
    loading,
    error,
    pendingItems,
    clearing,
    isItemPending: (productId) => Boolean(pendingItems[String(productId)]),
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  }), [cart, loading, error, pendingItems, clearing, addToCart, updateQuantity, removeItem, clearCart, refreshCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
