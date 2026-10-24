import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container placeholder-page py-5 text-center">
      <span className="not-found-code">404</span>
      <h1>Page not found</h1>
      <p>That page may have moved. Browse the MiniMart catalog to find what you need.</p>
      <Link to="/" className="btn btn-primary signup-button mt-2">Start shopping</Link>
    </section>
  );
}
