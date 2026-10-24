import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function navLinkClass({ isActive }) {
  return `nav-link${isActive ? ' active' : ''}`;
}

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    toast.success('You have signed out.');
    navigate('/login', { replace: true });
  };

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-lg container py-3" aria-label="Main navigation">
        <Link className="navbar-brand brand-mark" to="/" onClick={closeMenu}>
          <span className="brand-symbol" aria-hidden="true">M</span>
          <span>MiniMart</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`}>
          <div className="navbar-nav mx-lg-auto gap-lg-2">
            <NavLink className={navLinkClass} to="/" onClick={closeMenu} end>Home</NavLink>
            {!isAdmin && <NavLink className={({ isActive }) => `${navLinkClass({ isActive })} nav-cart-link`} to="/cart" onClick={closeMenu}>
              Cart<span className="nav-cart-count" aria-label={`${totalItems} items in cart`}>{totalItems}</span>
            </NavLink>}
            {user && !isAdmin && (
              <>
                <NavLink className={navLinkClass} to="/orders" onClick={closeMenu}>Orders</NavLink>
                <NavLink className={navLinkClass} to="/addresses" onClick={closeMenu}>Addresses</NavLink>
              </>
            )}
          </div>

          <div className="navbar-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
            {isLoading ? (
              <span className="small text-secondary" aria-live="polite">Checking session…</span>
            ) : user ? (
              <div className="account-menu-wrap">
                <button
                  className="btn account-button"
                  type="button"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <span className="account-avatar" aria-hidden="true">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  <span className="account-name">{user.name}</span>
                  <span className="account-chevron" aria-hidden="true">⌄</span>
                </button>
                {accountOpen && (
                  <div className="account-dropdown shadow-sm">
                    <span className="dropdown-email">{user.email}</span>
                    {isAdmin && <Link className="dropdown-item" to="/admin" onClick={closeMenu}>Admin</Link>}
                    <button className="dropdown-item logout-item" type="button" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link className="btn btn-link sign-in-link" to="/login" onClick={closeMenu}>Login</Link>
                <Link className="btn btn-primary signup-button" to="/register" onClick={closeMenu}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
