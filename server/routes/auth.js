const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validate, schemas } = require('../middleware/validate');
const AppError = require('../utils/AppError');

router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.matches(req.body.password))) throw new AppError('Invalid credentials', 401);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

router.get('/me', protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ id: _id, name, email, role });
});

router.post('/register', protect, allow('admin'), validate(schemas.register), asyncHandler(async (req, res) => {
  const u = await User.create(req.body);
  res.status(201).json({ id: u._id, name: u.name, email: u.email, role: u.role });
}));

router.get('/users', protect, allow('admin'), asyncHandler(async (req, res) => {
  res.json(await User.find().sort('name'));
}));

module.exports = router;