exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.notFound = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
};