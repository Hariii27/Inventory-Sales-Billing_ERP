const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) throw new AppError('Not authenticated', 401);
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id);
    if (!req.user) throw new AppError('User not found', 401);
    next();
  } catch (e) {
    next(e.status ? e : new AppError('Invalid or expired token', 401));
  }
};

exports.allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('Forbidden', 403));