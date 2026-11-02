const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');
const AppError = require('../utils/AppError');
const withTransaction = require('../utils/transaction');

// qty > 0 = stock in, qty < 0 = stock out
exports.move = async (session, { product, qty, reason, ref, user, note }) => {
  const filter = { _id: product };
  if (qty < 0) filter.stock = { $gte: -qty }; // atomic guard against negative stock

  const p = await Product.findOneAndUpdate(filter, { $inc: { stock: qty } }, { new: true, session });
  if (!p) throw new AppError('Insufficient stock or product not found', 400);

  await StockLedger.create(
    [{ product, qty, reason, ref, note, balance: p.stock, createdBy: user }],
    { session }
  );
  return p;
};

exports.adjust = (body, user) =>
  withTransaction((session) =>
    exports.move(session, {
      product: body.product,
      qty: body.qty,
      reason: 'adjustment',
      note: body.note,
      user: user._id,
    })
  );