import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import productApi from '../api/productApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import StockBadge from '../components/StockBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getApiError } from '../utils/apiError.js';
import formatCurrency from '../utils/formatCurrency.js';
import { getPostAuthTarget } from '../utils/navigation.js';

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addCartItem, isItemPending } = useCart();
  const [product, setProduct] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setLoadedId(null);
    setProduct(null);
    setErrorMessage('');
    setNotFound(false);
    setIsLoading(true);

    productApi.getProduct(id)
      .then(({ data }) => {
        if (requestId.current !== currentRequest) return;
        setProduct(data);
        setQuantity(1);
        setLoadedId(id);
      })
      .catch((error) => {
        if (requestId.current !== currentRequest) return;
        if (error.response?.status === 404) {
          setNotFound(true);
          setLoadedId(id);
          toast.error('Product not found.');
          return;
        }

        const result = getApiError(error, 'Could not load this product.');
        setErrorMessage(result.message);
        setLoadedId(id);
        toast.error(result.message);
      })
      .finally(() => {
        if (requestId.current === currentRequest) setIsLoading(false);
      });

    return () => {
      if (requestId.current === currentRequest) requestId.current += 1;
    };
  }, [id, retryCount]);

  const retry = () => {
    setLoadedId(null);
    setRetryCount((value) => value + 1);
  };

  const stock = Number(product?.stockQuantity) || 0;
  const hasStock = stock > 0;
  const adding = isItemPending(product?.id);
  const isCurrentProductLoaded = loadedId === id;
  const showLoader = isLoading || !isCurrentProductLoaded;
  const backToProducts = getPostAuthTarget(
    { state: { from: location.state?.from } },
    '/',
  );

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      await addCartItem(product.id, quantity);
    } catch {
      // CartContext shows the backend error in a toast.
    }
  };

  return (
    <div className="container product-detail-page py-4 py-lg-5">
      <Link className="back-to-products" to={backToProducts}>← Back to products</Link>

      {showLoader && <Loader label="Loading product…" />}

      {!showLoader && notFound && (
        <div className="product-detail-message">
          <div className="not-found-code">404</div>
          <h1>Product not found</h1>
          <p>This product may have been removed or the link may be incorrect.</p>
          <Link className="btn btn-primary signup-button mt-2" to="/">Back to Home</Link>
        </div>
      )}

      {!showLoader && !notFound && errorMessage && (
        <div className="product-detail-message">
          <ErrorMessage message={errorMessage} />
          <button className="btn btn-outline-primary home-login" type="button" onClick={retry}>Retry</button>
        </div>
      )}

      {!showLoader && !notFound && !errorMessage && product && (
        <article className="product-detail-card row g-0">
          <div className="col-12 col-lg-6 product-detail-visual">
            <ProductImage className="product-detail-image" src={product.imageUrl} alt={product.name} />
          </div>
          <div className="col-12 col-lg-6 product-detail-content">
            <span className="product-category detail-category">{product.categoryName || 'Everyday essentials'}</span>
            <h1>{product.name}</h1>
            <div className="product-detail-price">{formatCurrency(product.price)}</div>
            <StockBadge stockQuantity={product.stockQuantity} />
            <p className="product-detail-description">{product.description}</p>

            <div className="product-quantity-control">
              <label className="form-label" htmlFor="product-quantity">Quantity</label>
              <div className="quantity-stepper">
                <button
                  className="btn quantity-step-button"
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={!hasStock || quantity <= 1}
                >−</button>
                <input
                  id="product-quantity"
                  className="form-control"
                  type="number"
                  min="1"
                  max={stock}
                  step="1"
                  value={quantity}
                  disabled={!hasStock}
                  onChange={(event) => {
                    const requested = Number(event.target.value);
                    setQuantity(Number.isFinite(requested) ? Math.min(stock, Math.max(1, Math.floor(requested))) : 1);
                  }}
                />
                <button
                  className="btn quantity-step-button"
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                  disabled={!hasStock || quantity >= stock}
                >+</button>
              </div>
              {hasStock && <span className="available-stock">{stock} available</span>}
            </div>

            <button className="btn btn-primary detail-add-button" type="button" onClick={addToCart} disabled={!hasStock || adding}>
              {!hasStock ? 'Out of stock' : adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
