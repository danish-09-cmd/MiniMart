export default function StockBadge({ stockQuantity }) {
  const stock = Number(stockQuantity) || 0;

  if (stock <= 0) {
    return <span className="stock-badge stock-badge-out">Out of stock</span>;
  }

  if (stock < 5) {
    return <span className="stock-badge stock-badge-low">Only {stock} left</span>;
  }

  return <span className="stock-badge stock-badge-in">In stock</span>;
}
