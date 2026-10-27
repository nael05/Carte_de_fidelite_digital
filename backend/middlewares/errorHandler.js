import logger from '../utils/logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id ? `User: ${req.user.id}` : 'Anonymous',
  });
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erreur serveur';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
  });

  res.status(404).json({
    error: 'Route non trouvée',
  });
};

export default errorHandler;
