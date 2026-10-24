import { NavLink, Outlet } from 'react-router-dom';

const sections = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
];

export default function AdminLayout() {
  return (
    <div className="container admin-shell py-4 py-lg-5">
      <header className="admin-heading mb-4">
        <div><span className="section-eyebrow">Store management</span><h1>Admin</h1></div>
      </header>
      <div className="admin-layout-grid">
        <nav className="admin-sidebar" aria-label="Admin sections">
          {sections.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <section className="admin-content"><Outlet /></section>
      </div>
    </div>
  );
}
