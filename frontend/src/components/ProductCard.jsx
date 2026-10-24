import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import ProductImage from './ProductImage.jsx';
import StockBadge from './StockBadge.jsx';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart: addCartItem, isItemPending } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const hasStock = Number(product.stockQuantity) > 0;
  const adding = isItemPending(product.id);
  const detailPath = `/products/${product.id}`;

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      await addCartItem(product.id, 1);
    } catch {
      // CartContext shows the backend error in a toast.
    }
  };

  return (
    <article className="product-card h-100">
      <Link className="product-card-visual" to={detailPath} state={{ from: location }} aria-label={`View ${product.name}`}>
        <ProductImage className="product-card-image" src={product.imageUrl} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <span className="product-category">{product.categoryName || 'Everyday essentials'}</span>
          <StockBadge stockQuantity={product.stockQuantity} />
        </div>
        <h2 className="product-card-title">
          <Link to={detailPath} state={{ from: location }}>{product.name}</Link>
        </h2>
        <div className="product-card-footer mt-auto">
          <strong className="product-price">{formatCurrency(product.price)}</strong>
          <button className="btn btn-outline-primary add-to-cart-button" type="button" onClick={addToCart} disabled={!hasStock || adding}>
            {!hasStock ? 'Unavailable' : adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
