const router = require('express').Router();
const StockLedger = require('../models/StockLedger');
const stock = require('../services/stock.service');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validate, schemas } = require('../middleware/validate');

router.use(protect);

router.get('/ledger', asyncHandler(async (req, res) => {
  const q = req.query.product ? { product: req.query.product } : {};
  res.json(
    await StockLedger.find(q)
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(200)
  );
}));

// Manual correction (damage, count difference, opening stock)
router.post('/adjust', allow('admin', 'store'), validate(schemas.adjust), asyncHandler(async (req, res) => {
  res.status(201).json(await stock.adjust(req.body, req.user));
}));

module.exports = router;