export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
        <span className="footer-brand">MiniMart</span>
        <span>Everyday essentials, thoughtfully chosen.</span>
        <span>© {new Date().getFullYear()} MiniMart</span>
      </div>
    </footer>
  );
}
