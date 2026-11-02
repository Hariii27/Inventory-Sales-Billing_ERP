const router = require('express').Router();
const Order = require('../models/Order');
const svc = require('../services/order.service');
const pdf = require('../services/pdf.service');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validate, schemas } = require('../middleware/validate');
const AppError = require('../utils/AppError');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.type) q.type = req.query.type;
  if (req.query.status) q.status = req.query.status;
  res.json(await Order.find(q).populate('party', 'name').sort('-createdAt').limit(100));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id).populate('party');
  if (!o) throw new AppError('Order not found', 404);
  res.json(o);
}));

router.post('/', allow('admin', 'sales', 'store'), validate(schemas.order), asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!['sale', 'purchase'].includes(type)) throw new AppError("Query 'type' must be sale or purchase", 400);
  res.status(201).json(await svc.create(type, req.body, req.user));
}));

router.post('/:id/confirm', allow('admin', 'sales', 'store'), asyncHandler(async (req, res) => {
  res.json(await svc.confirm(req.params.id, req.user));
}));

router.post('/:id/cancel', allow('admin'), asyncHandler(async (req, res) => {
  res.json(await svc.cancel(req.params.id, req.user));
}));

router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id).populate('party');
  if (!o) throw new AppError('Order not found', 404);
  pdf.invoice(o, res);
}));

module.exports = router;