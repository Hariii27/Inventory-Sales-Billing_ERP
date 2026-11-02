const router = require('express').Router();
const Party = require('../models/Party');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validate, schemas } = require('../middleware/validate');
const AppError = require('../utils/AppError');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const q = req.query.type ? { type: req.query.type } : {};
  res.json(await Party.find(q).sort('name'));
}));

router.post('/', allow('admin', 'sales', 'store'), validate(schemas.partyCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await Party.create(req.body));
}));

router.put('/:id', allow('admin', 'sales', 'store'), validate(schemas.partyUpdate), asyncHandler(async (req, res) => {
  const p = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!p) throw new AppError('Party not found', 404);
  res.json(p);
}));

module.exports = router;