const STATUS_LABELS = {
  PLACED: 'Placed',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  SUCCESS: 'Successful',
  FAILED: 'Failed',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'PENDING').toUpperCase();
  const label = STATUS_LABELS[normalizedStatus] || normalizedStatus.replaceAll('_', ' ');
  return <span className={`status-badge status-${normalizedStatus.toLowerCase()}`}>{label}</span>;
}
