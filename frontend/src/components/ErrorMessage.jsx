export default function ErrorMessage({ message, className = '', onRetry }) {
  if (!message) return null;

  return (
    <div className={`alert alert-danger ${className}`.trim()} role="alert">
      <span>{message}</span>
      {onRetry && <button className="btn btn-sm btn-outline-danger ms-3" type="button" onClick={onRetry}>Retry</button>}
    </div>
  );
}
