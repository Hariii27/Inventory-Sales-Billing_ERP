import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { dateStr } from '../utils/format';

const empty = { name: '', email: '', password: '', role: 'sales' };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try { setRows((await api.get('/auth/users')).data); setError(''); } catch (e) { setError(errMsg(e)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/auth/register', form);
      setModal(false);
      setForm(empty);
      load();
    } catch (err) { setFormError(errMsg(err)); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Users</h1>
        <button className="btn btn-primary" onClick={() => { setFormError(''); setModal(true); }}>Add user</button>
      </div>

      {error && <div className="alert">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role', render: (r) => <span className="badge">{r.role}</span> },
          { key: 'createdAt', label: 'Created', render: (r) => dateStr(r.createdAt) },
        ]}
      />

      {modal && (
        <Modal title="Add user" onClose={() => setModal(false)}>
          <form onSubmit={save}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <div><label>Name</label><input required minLength={2} value={form.name} onChange={set('name')} /></div>
              <div><label>Email</label><input type="email" required value={form.email} onChange={set('email')} /></div>
              <div><label>Password (min 6)</label><input type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>
              <div>
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="store">Store</option>
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary">Create user</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}