// middlewares/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      errors: [{
        msg: err.message,
        param: err.path
      }]
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      errors: [{
        msg: 'This email is already registered',
        param: 'email'
      }]
    });
  }

  res.status(500).json({
    errors: [{
      msg: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    }]
  });
};

module.exports = errorHandler;