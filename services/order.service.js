const Order = require('../models/Order');
const Product = require('../models/Product');
const Party = require('../models/Party');
const stock = require('./stock.service');
const numbering = require('./numbering.service');
const withTransaction = require('../utils/transaction');
const AppError = require('../utils/AppError');

const ROLES_FOR = { sale: ['admin', 'sales'], purchase: ['admin', 'store'] };

const assertRole = (user, type) => {
  if (!ROLES_FOR[type].includes(user.role))
    throw new AppError(`Role '${user.role}' cannot handle ${type} orders`, 403);
};

exports.create = async (type, body, user) => {
  assertRole(user, type);

  const expected = type === 'sale' ? 'customer' : 'supplier';
  const party = await Party.findById(body.party);
  if (!party || party.type !== expected) throw new AppError(`Party must be a ${expected}`, 400);

  const products = await Product.find({
    _id: { $in: body.items.map((i) => i.product) },
    active: true,
  });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Snapshot name and GST so later product edits do not alter existing orders
  const items = body.items.map((i) => {
    const p = byId.get(i.product);
    if (!p) throw new AppError(`Invalid or inactive product: ${i.product}`, 400);
    return { product: p._id, name: p.name, qty: i.qty, price: i.price ?? p.price, gstRate: p.gstRate };
  });

  return Order.create({ type, party: party._id, items, createdBy: user._id });
};

exports.confirm = (id, user) =>
  withTransaction(async (session) => {
    const o = await Order.findOne({ _id: id, status: 'draft' }).session(session);
    if (!o) throw new AppError('Order not found or not in draft status', 404);
    assertRole(user, o.type);

    const sign = o.type === 'sale' ? -1 : 1;
    for (const i of o.items) {
      await stock.move(session, {
        product: i.product,
        qty: sign * i.qty,
        reason: o.type,
        ref: o._id,
        user: user._id,
      });
    }

    o.number = await numbering.next(o.type === 'sale' ? 'INV' : 'PO', session);
    o.status = 'confirmed';
    o.updatedBy = user._id;
    await o.save({ session });
    return o;
  });

exports.cancel = (id, user) =>
  withTransaction(async (session) => {
    const o = await Order.findOne({ _id: id, status: { $in: ['draft', 'confirmed'] } }).session(session);
    if (!o) throw new AppError('Order not found or already cancelled', 404);

    if (o.status === 'confirmed') {
      const sign = o.type === 'sale' ? 1 : -1; // reverse the original movement
      for (const i of o.items) {
        await stock.move(session, {
          product: i.product,
          qty: sign * i.qty,
          reason: `${o.type}_cancel`,
          ref: o._id,
          user: user._id,
        });
      }
    }

    o.status = 'cancelled';
    o.updatedBy = user._id;
    await o.save({ session });
    return o;
  });