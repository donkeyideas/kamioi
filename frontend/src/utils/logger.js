/**
 * Development-only logger utility
 *
 * Provides console logging that only works in development mode.
 * In production builds, all log calls become no-ops for performance.
 *
 * Usage:
 *   import logger from '@/utils/logger';
 *   logger.log('Debug message');
 *   logger.error('Error message');
 *   logger.warn('Warning');
 *   logger.info('Info');
 *   logger.debug('Debug', { data });
 */

const isDev = import.meta.env.DEV;

// No-op function for production
const noop = () => {};

/**
 * Logger object with methods that only log in development
 */
const logger = {
  /**
   * General log (equivalent to console.log)
   */
  log: isDev ? (...args) => console.log('[LOG]', ...args) : noop,

  /**
   * Error log (always logs, even in production for critical errors)
   */
  error: (...args) => console.error('[ERROR]', ...args),

  /**
   * Warning log
   */
  warn: isDev ? (...args) => console.warn('[WARN]', ...args) : noop,

  /**
   * Info log
   */
  info: isDev ? (...args) => console.info('[INFO]', ...args) : noop,

  /**
   * Debug log (verbose, dev only)
   */
  debug: isDev ? (...args) => console.log('[DEBUG]', ...args) : noop,

  /**
   * Group logs together
   */
  group: isDev ? (label) => console.group(label) : noop,
  groupEnd: isDev ? () => console.groupEnd() : noop,

  /**
   * Table display for objects/arrays
   */
  table: isDev ? (data) => console.table(data) : noop,

  /**
   * Time tracking
   */
  time: isDev ? (label) => console.time(label) : noop,
  timeEnd: isDev ? (label) => console.timeEnd(label) : noop,

  /**
   * API call logging helper
   */
  api: isDev ? (method, url, data) => {
    console.log(`[API] ${method} ${url}`, data || '');
  } : noop,

  /**
   * Component lifecycle logging
   */
  component: isDev ? (name, action, data) => {
    console.log(`[${name}] ${action}`, data || '');
  } : noop,
};

export default logger;

// Named exports for convenience
export const { log, error, warn, info, debug, api, component } = logger;
