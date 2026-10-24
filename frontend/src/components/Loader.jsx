export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="spinner-border text-success" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  );
}
