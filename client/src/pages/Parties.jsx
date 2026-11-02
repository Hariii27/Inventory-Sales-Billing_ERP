import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const empty = { name: '', phone: '', email: '', address: '', gstin: '' };

export default function Parties() {
  const [type, setType] = useState('customer');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/parties', { params: { type } });
      setRows(data);
      setError('');
    } catch (e) { setError(errMsg(e)); }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(empty); setFormError(''); setModal({ mode: 'add' }); };
  const openEdit = (p) => {
    setForm({
      name: p.name, phone: p.phone || '', email: p.email || '',
      address: p.address || '', gstin: p.gstin || '',
    });
    setFormError('');
    setModal({ mode: 'edit', id: p._id });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (modal.mode === 'add') await api.post('/parties', { ...form, type });
      else await api.put(`/parties/${modal.id}`, form);
      setModal(null);
      load();
    } catch (err) { setFormError(errMsg(err)); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const label = type === 'customer' ? 'customer' : 'supplier';

  return (
    <>
      <div className="page-head">
        <h1>Parties</h1>
        <button className="btn btn-primary" onClick={openAdd}>Add {label}</button>
      </div>

      <div className="tabs">
        <button className={type === 'customer' ? 'active' : ''} onClick={() => setType('customer')}>Customers</button>
        <button className={type === 'supplier' ? 'active' : ''} onClick={() => setType('supplier')}>Suppliers</button>
      </div>

      {error && <div className="alert">{error}</div>}
      <DataTable
        rows={rows}
        empty={`No ${label}s yet`}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'gstin', label: 'GSTIN' },
          { key: 'address', label: 'Address' },
          {
            key: 'actions', label: '', align: 'right',
            render: (r) => <button className="btn btn-ghost" onClick={() => openEdit(r)}>Edit</button>,
          },
        ]}
      />

      {modal && (
        <Modal title={`${modal.mode === 'add' ? 'Add' : 'Edit'} ${label}`} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <div><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
              <div><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
              <div><label>Email</label><input type="email" value={form.email} onChange={set('email')} /></div>
              <div><label>GSTIN</label><input value={form.gstin} onChange={set('gstin')} /></div>
              <div className="span2"><label>Address</label><input value={form.address} onChange={set('address')} /></div>
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