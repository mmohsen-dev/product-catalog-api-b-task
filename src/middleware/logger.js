const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bosta-catalog' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE || 'logs/app.log',
    format: winston.format.json()
  }));
}

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info({
    type: 'REQUEST',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    ...(req.method === 'POST' && { body: req.body })
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info({
      type: 'RESPONSE',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger; 