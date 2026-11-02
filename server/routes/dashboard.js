const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

router.get('/', protect, allow('admin'), asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthMatch = { type: 'sale', status: 'confirmed', createdAt: { $gte: monthStart } };

  const [revenue, top, trend, lowStock, pending] = await Promise.all([
    Order.aggregate([
      { $match: monthMatch },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: monthMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { type: 'sale', status: 'confirmed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Product.countDocuments({ active: true, $expr: { $lte: ['$stock', '$reorderLevel'] } }),
    Order.countDocuments({ status: 'draft' }),
  ]);

  res.json({
    monthRevenue: revenue[0]?.total || 0,
    invoices: revenue[0]?.count || 0,
    topProducts: top,
    monthlyTrend: trend.map((t) => ({ year: t._id.y, month: t._id.m, total: t.total })),
    lowStock,
    pendingOrders: pending,
  });
}));

module.exports = router;