import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { dateTime } from '../utils/format';

const REASONS = {
  purchase: 'Purchase', sale: 'Sale', sale_cancel: 'Sale cancelled',
  purchase_cancel: 'Purchase cancelled', adjustment: 'Adjustment',
};

export default function Inventory() {
  const { user } = useAuth();
  const canAdjust = ['admin', 'store'].includes(user.role);

  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product: '', qty: '', note: '' });
  const [formError, setFormError] = useState('');

  const loadProducts = useCallback(async () => {
    try { setProducts((await api.get('/products')).data); } catch (e) { setError(errMsg(e)); }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory/ledger', { params: { product: filter || undefined } });
      setLedger(data);
    } catch (e) { setError(errMsg(e)); }
  }, [filter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const adjust = async (e) => {
    e.preventDefault();
    setFormError('');
    const qty = Number(form.qty);
    if (!Number.isInteger(qty) || qty === 0) return setFormError('Quantity must be a non-zero whole number');
    try {
      await api.post('/inventory/adjust', { product: form.product, qty, note: form.note || undefined });
      setModal(false);
      setForm({ product: '', qty: '', note: '' });
      loadProducts();
      loadLedger();
    } catch (err) { setFormError(errMsg(err)); }
  };

  const stockRows = lowOnly ? products.filter((p) => p.stock <= p.reorderLevel) : products;

  return (
    <>
      <div className="page-head">
        <h1>Inventory</h1>
        {canAdjust && (
          <button className="btn btn-primary" onClick={() => { setFormError(''); setModal(true); }}>
            Adjust stock
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Current stock</button>
        <button className={tab === 'ledger' ? 'active' : ''} onClick={() => setTab('ledger')}>Stock ledger</button>
      </div>

      {error && <div className="alert">{error}</div>}

      {tab === 'stock' && (
        <>
          <label className="check">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Show low-stock items only
          </label>
          <DataTable
            rows={stockRows}
            empty="No products to show"
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'name', label: 'Product' },
              { key: 'stock', label: 'In stock', align: 'right' },
              { key: 'reorderLevel', label: 'Reorder at', align: 'right' },
              {
                key: 'state', label: 'Status',
                render: (r) => r.stock <= r.reorderLevel
                  ? <span className="badge bad">Low</span>
                  : <span className="badge ok">OK</span>,
              },
            ]}
          />
        </>
      )}

      {tab === 'ledger' && (
        <>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All products</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
          </select>
          <DataTable
            rows={ledger}
            empty="No stock movements yet"
            columns={[
              { key: 'createdAt', label: 'Date', render: (r) => dateTime(r.createdAt) },
              { key: 'product', label: 'Product', render: (r) => r.product?.name },
              { key: 'reason', label: 'Reason', render: (r) => REASONS[r.reason] || r.reason },
              {
                key: 'qty', label: 'Change', align: 'right',
                render: (r) => <span className={r.qty > 0 ? 'text-ok' : 'text-bad'}>{r.qty > 0 ? `+${r.qty}` : r.qty}</span>,
              },
              { key: 'balance', label: 'Balance', align: 'right' },
              { key: 'by', label: 'By', render: (r) => r.createdBy?.name },
              { key: 'note', label: 'Note', render: (r) => r.note || '' },
            ]}
          />
        </>
      )}

      {modal && (
        <Modal title="Adjust stock" onClose={() => setModal(false)}>
          <form onSubmit={adjust}>
            {formError && <div className="alert">{formError}</div>}
            <label>Product</label>
            <select required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select...</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} (stock {p.stock})</option>)}
            </select>
            <label>Quantity (use a negative number to reduce)</label>
            <input type="number" step="1" required value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            <label>Note</label>
            <input value={form.note} placeholder="Opening stock, damage, count correction..."
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary">Apply</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}