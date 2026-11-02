import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { money } from '../utils/format';

const empty = { sku: '', name: '', price: '', gstRate: '18', reorderLevel: '10' };

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/products', { params: { search: search || undefined } });
      setRows(data);
      setError('');
    } catch (e) { setError(errMsg(e)); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => { setForm(empty); setFormError(''); setModal({ mode: 'add' }); };
  const openEdit = (p) => {
    setForm({
      sku: p.sku, name: p.name, price: String(p.price),
      gstRate: String(p.gstRate), reorderLevel: String(p.reorderLevel),
    });
    setFormError('');
    setModal({ mode: 'edit', id: p._id });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    const body = {
      sku: form.sku, name: form.name,
      price: Number(form.price), gstRate: Number(form.gstRate),
      reorderLevel: Number(form.reorderLevel),
    };
    try {
      if (modal.mode === 'add') await api.post('/products', body);
      else await api.put(`/products/${modal.id}`, body);
      setModal(null);
      load();
    } catch (err) { setFormError(errMsg(err)); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    try { await api.delete(`/products/${p._id}`); load(); } catch (err) { setError(errMsg(err)); }
  };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price', align: 'right', render: (r) => money(r.price) },
    { key: 'gstRate', label: 'GST %', align: 'right' },
    {
      key: 'stock', label: 'Stock', align: 'right',
      render: (r) => <span className={r.stock <= r.reorderLevel ? 'text-bad' : ''}>{r.stock}</span>,
    },
    { key: 'reorderLevel', label: 'Reorder at', align: 'right' },
  ];
  if (isAdmin) {
    columns.push({
      key: 'actions', label: '', align: 'right',
      render: (r) => (
        <div className="row end">
          <button className="btn btn-ghost" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-danger" onClick={() => remove(r)}>Delete</button>
        </div>
      ),
    });
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <div className="row">
          <input placeholder="Search name or SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}>Add product</button>}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      <DataTable columns={columns} rows={rows} empty="No products found" />
      {isAdmin && <p className="muted small">Stock is changed only through purchases, sales or Inventory adjustments.</p>}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add product' : 'Edit product'} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <div><label>SKU</label><input required value={form.sku} onChange={set('sku')} /></div>
              <div><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
              <div><label>Price (INR)</label><input type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} /></div>
              <div><label>GST %</label><input type="number" min="0" max="100" step="0.01" required value={form.gstRate} onChange={set('gstRate')} /></div>
              <div><label>Reorder level</label><input type="number" min="0" step="1" required value={form.reorderLevel} onChange={set('reorderLevel')} /></div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}