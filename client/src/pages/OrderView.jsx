import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { money, dateTime } from '../utils/format';

const CONFIRM_ROLES = { sale: ['admin', 'sales'], purchase: ['admin', 'store'] };

export default function OrderView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (e) { setError(errMsg(e)); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error && !order) return <div className="alert">{error}</div>;
  if (!order) return <p className="muted">Loading...</p>;

  const isSale = order.type === 'sale';
  const canConfirm = order.status === 'draft' && CONFIRM_ROLES[order.type].includes(user.role);
  const canCancel = order.status !== 'cancelled' && user.role === 'admin';

  const act = async (action, message) => {
    if (!window.confirm(message)) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/orders/${id}/${action}`);
      await load();
    } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  const openPdf = async () => {
    const win = window.open('', '_blank'); // opened synchronously to avoid popup blocking
    try {
      const { data } = await api.get(`/orders/${id}/pdf`, { responseType: 'blob' });
      win.location.href = URL.createObjectURL(data);
    } catch (e) {
      if (win) win.close();
      setError(errMsg(e));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link to={`/orders/${order.type}`} className="muted small">&larr; Back to {isSale ? 'sales' : 'purchases'}</Link>
          <h1>
            {order.number || 'Draft'} <StatusBadge status={order.status} />
          </h1>
        </div>
        <div className="row">
          <button className="btn btn-ghost" onClick={openPdf}>View PDF</button>
          {canConfirm && (
            <button className="btn btn-primary" disabled={busy}
              onClick={() => act('confirm', isSale
                ? 'Confirm this invoice? Stock will be reduced.'
                : 'Confirm this purchase? Stock will be increased.')}>
              Confirm
            </button>
          )}
          {canCancel && (
            <button className="btn btn-danger" disabled={busy}
              onClick={() => act('cancel', order.status === 'confirmed'
                ? 'Cancel this order? Stock movements will be reversed.'
                : 'Cancel this draft?')}>
              Cancel order
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card meta">
        <div><span className="muted">Type</span><strong>{isSale ? 'Sales invoice' : 'Purchase order'}</strong></div>
        <div><span className="muted">{isSale ? 'Customer' : 'Supplier'}</span><strong>{order.party?.name}</strong></div>
        <div><span className="muted">GSTIN</span><strong>{order.party?.gstin || '-'}</strong></div>
        <div><span className="muted">Created</span><strong>{dateTime(order.createdAt)}</strong></div>
      </div>

      <DataTable
        rows={order.items.map((i, idx) => ({ ...i, _id: `${i.product}-${idx}` }))}
        columns={[
          { key: 'name', label: 'Item' },
          { key: 'qty', label: 'Qty', align: 'right' },
          { key: 'price', label: 'Price', align: 'right', render: (r) => money(r.price) },
          { key: 'gstRate', label: 'GST %', align: 'right' },
          { key: 'amount', label: 'Amount', align: 'right', render: (r) => money(r.qty * r.price) },
        ]}
      />

      <div className="totals">
        <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div><span>GST</span><span>{money(order.tax)}</span></div>
        <div className="grand"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
    </>
  );
}