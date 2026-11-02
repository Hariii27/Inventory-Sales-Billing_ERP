import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

const demo = [
  { role: 'Admin', email: 'admin@demo.com', password: 'admin123' },
  { role: 'Sales', email: 'sales@demo.com', password: 'sales123' },
  { role: 'Store', email: 'store@demo.com', password: 'store123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <h2>Inventory, Sales & Billing ERP</h2>
        <p className="muted">Sign in to continue</p>
        {error && <div className="alert">{error}</div>}

        <label>Email</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />

        <label>Password</label>
        <input type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button className="btn btn-primary block" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="demo">
          <span className="muted">Demo accounts (click to fill):</span>
          <div className="row">
            {demo.map((d) => (
              <button type="button" key={d.role} className="btn btn-ghost"
                onClick={() => setForm({ email: d.email, password: d.password })}>
                {d.role}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}