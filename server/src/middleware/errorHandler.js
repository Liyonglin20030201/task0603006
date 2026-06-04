const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
