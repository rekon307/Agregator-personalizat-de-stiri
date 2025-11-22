import winston from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Structured logger using Winston
 * Provides consistent logging across the application
 *
 * @example
 * ```typescript
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('Failed to fetch data', { error: error.message, userId });
 * ```
 */
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Don't exit on errors
  exitOnError: false,
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create a stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Log a database query with timing
 */
export function logQuery(query: string, duration: number, params?: any) {
  logger.debug('Database query executed', {
    query,
    duration: `${duration}ms`,
    params,
  });
}

/**
 * Log an HTTP request
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number) {
  logger.info('HTTP request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
}

/**
 * Log a user action
 */
export function logUserAction(action: string, userId: string, metadata?: Record<string, any>) {
  logger.info('User action', {
    action,
    userId,
    ...metadata,
  });
}
