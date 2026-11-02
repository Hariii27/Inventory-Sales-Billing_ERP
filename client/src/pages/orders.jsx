import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { money, dateStr } from '../utils/format';

const CREATE_ROLES = { sale: ['admin', 'sales'], purchase: ['admin', 'store'] };

export default function Orders() {
  const { type } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CREATE_ROLES[type]) return;
    api.get('/orders', { params: { type, status: status || undefined } })
      .then((r) => { setRows(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [type, status]);

  if (!CREATE_ROLES[type]) return <Navigate to="/" replace />;

  const isSale = type === 'sale';
  const canCreate = CREATE_ROLES[type].includes(user.role);

  return (
    <>
      <div className="page-head">
        <h1>{isSale ? 'Sales Invoices' : 'Purchase Orders'}</h1>
        <div className="row">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {canCreate && (
            <Link className="btn btn-primary" to={`/orders/${type}/new`}>
              New {isSale ? 'sale' : 'purchase'}
            </Link>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      <DataTable
        rows={rows}
        onRowClick={(r) => nav(`/order/${r._id}`)}
        empty="No orders found"
        columns={[
          { key: 'number', label: 'Number', render: (r) => r.number || <span className="muted">DRAFT</span> },
          { key: 'party', label: isSale ? 'Customer' : 'Supplier', render: (r) => r.party?.name },
          { key: 'createdAt', label: 'Date', render: (r) => dateStr(r.createdAt) },
          { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </>
  );
}