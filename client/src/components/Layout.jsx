import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  { to: '/products', label: 'Products' },
  { to: '/parties', label: 'Parties' },
  { to: '/orders/sale', label: 'Sales' },
  { to: '/orders/purchase', label: 'Purchases' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/users', label: 'Users', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ERP</div>
        <nav>
          {links
            .filter((l) => !l.roles || l.roles.includes(user.role))
            .map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="btn btn-ghost-light" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}