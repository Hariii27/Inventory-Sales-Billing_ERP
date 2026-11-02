import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';

const CREATE_ROLES = { sale: ['admin', 'sales'], purchase: ['admin', 'store'] };
const blank = { product: '', qty: '1', price: '' };

export default function OrderForm() {
  const { type } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const isSale = type === 'sale';

  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [party, setParty] = useState('');
  const [lines, setLines] = useState([{ ...blank }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CREATE_ROLES[type]) return;
    Promise.all([
      api.get('/parties', { params: { type: isSale ? 'customer' : 'supplier' } }),
      api.get('/products'),
    ])
      .then(([pa, pr]) => { setParties(pa.data); setProducts(pr.data); })
      .catch((e) => setError(errMsg(e)));
  }, [type, isSale]);

  const prodMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  if (!CREATE_ROLES[type]) return <Navigate to="/" replace />;
  if (!CREATE_ROLES[type].includes(user.role)) {
    return <div className="alert">Your role cannot create {type} orders.</div>;
  }

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const pickProduct = (i, id) => {
    const p = prodMap.get(id);
    setLine(i, { product: id, price: p ? String(p.price) : '' });
  };

  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    const p = prodMap.get(l.product);
    if (!p) continue;
    const amount = (Number(l.qty) || 0) * (Number(l.price) || 0);
    subtotal += amount;
    tax += (amount * p.gstRate) / 100;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!party) return setError(`Select a ${isSale ? 'customer' : 'supplier'}`);
    for (const [i, l] of lines.entries()) {
      if (!l.product) return setError(`Line ${i + 1}: select a product`);
      if (!Number.isInteger(Number(l.qty)) || Number(l.qty) < 1)
        return setError(`Line ${i + 1}: quantity must be a whole number of at least 1`);
      if (l.price === '' || Number(l.price) < 0) return setError(`Line ${i + 1}: enter a valid price`);
    }

    setBusy(true);
    try {
      const body = {
        party,
        items: lines.map((l) => ({ product: l.product, qty: Number(l.qty), price: Number(l.price) })),
      };
      const { data } = await api.post('/orders', body, { params: { type } });
      nav(`/order/${data._id}`);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>New {isSale ? 'sales invoice' : 'purchase order'}</h1>
      </div>

      <form className="card" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <label>{isSale ? 'Customer' : 'Supplier'}</label>
        <select required value={party} onChange={(e) => setParty(e.target.value)}>
          <option value="">Select...</option>
          {parties.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>

        <h3>Items</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="right">Qty</th>
                <th className="right">Price</th>
                <th className="right">GST %</th>
                <th className="right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const p = prodMap.get(l.product);
                const amount = (Number(l.qty) || 0) * (Number(l.price) || 0);
                return (
                  <tr key={i}>
                    <td>
                      <select value={l.product} onChange={(e) => pickProduct(i, e.target.value)}>
                        <option value="">Select product...</option>
                        {products.map((pr) => (
                          <option key={pr._id} value={pr._id}>
                            {pr.name} ({pr.sku}){isSale ? ` - stock ${pr.stock}` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="right">
                      <input className="num" type="number" min="1" step="1" value={l.qty}
                        onChange={(e) => setLine(i, { qty: e.target.value })} />
                    </td>
                    <td className="right">
                      <input className="num" type="number" min="0" step="0.01" value={l.price}
                        onChange={(e) => setLine(i, { price: e.target.value })} />
                    </td>
                    <td className="right">{p ? p.gstRate : '-'}</td>
                    <td className="right">{money(amount)}</td>
                    <td className="right">
                      {lines.length > 1 && (
                        <button type="button" className="btn btn-ghost"
                          onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="button" className="btn btn-ghost" onClick={() => setLines((ls) => [...ls, { ...blank }])}>
          + Add line
        </button>

        <div className="totals">
          <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div><span>GST</span><span>{money(tax)}</span></div>
          <div className="grand"><span>Total</span><span>{money(subtotal + tax)}</span></div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save as draft'}</button>
        </div>
      </form>
    </>
  );
}