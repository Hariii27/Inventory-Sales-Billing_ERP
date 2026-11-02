const router = require('express').Router();
const Product = require('../models/Product');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validate, schemas } = require('../middleware/validate');
const AppError = require('../utils/AppError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const q = { active: true };
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    q.$or = [{ name: rx }, { sku: rx }];
  }
  res.json(await Product.find(q).sort('name'));
}));

router.get('/low-stock', asyncHandler(async (req, res) => {
  res.json(await Product.find({ active: true, $expr: { $lte: ['$stock', '$reorderLevel'] } }).sort('stock'));
}));

router.post('/', allow('admin'), validate(schemas.productCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await Product.create(req.body));
}));

router.put('/:id', allow('admin'), validate(schemas.productUpdate), asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!p) throw new AppError('Product not found', 404);
  res.json(p);
}));

router.delete('/:id', allow('admin'), asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, { active: false });
  if (!p) throw new AppError('Product not found', 404);
  res.status(204).end(); // soft delete
}));

module.exports = router;