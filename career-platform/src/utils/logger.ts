/**
 * Centralized logging utility for PivotAI
 * 
 * This logger allows us to:
 * 1. Easily disable all console logging in production
 * 2. Keep a consistent logging format
 * 3. Control log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFunction = (...args: any[]) => void;

// Set to false to disable all console logs
const ENABLE_LOGGING = process.env.NODE_ENV === 'development';

// Create no-op functions that do nothing when logging is disabled
const noop: LogFunction = () => {};

// Create the logger object
const logger = {
  debug: ENABLE_LOGGING ? console.debug.bind(console, '[PivotAI:DEBUG]') : noop,
  log: ENABLE_LOGGING ? console.log.bind(console, '[PivotAI:INFO]') : noop,
  info: ENABLE_LOGGING ? console.info.bind(console, '[PivotAI:INFO]') : noop,
  warn: ENABLE_LOGGING ? console.warn.bind(console, '[PivotAI:WARN]') : noop,
  error: ENABLE_LOGGING ? console.error.bind(console, '[PivotAI:ERROR]') : noop,
  group: ENABLE_LOGGING ? console.group.bind(console) : noop,
  groupEnd: ENABLE_LOGGING ? console.groupEnd.bind(console) : noop,
  
  // Create a namespaced logger
  createNamespace: (namespace: string) => ({
    debug: ENABLE_LOGGING ? console.debug.bind(console, `[PivotAI:${namespace}:DEBUG]`) : noop,
    log: ENABLE_LOGGING ? console.log.bind(console, `[PivotAI:${namespace}:INFO]`) : noop,
    info: ENABLE_LOGGING ? console.info.bind(console, `[PivotAI:${namespace}:INFO]`) : noop,
    warn: ENABLE_LOGGING ? console.warn.bind(console, `[PivotAI:${namespace}:WARN]`) : noop,
    error: ENABLE_LOGGING ? console.error.bind(console, `[PivotAI:${namespace}:ERROR]`) : noop,
    group: ENABLE_LOGGING ? (label: string) => console.group(`[PivotAI:${namespace}] ${label}`) : noop,
    groupEnd: ENABLE_LOGGING ? console.groupEnd.bind(console) : noop,
  })
};

export default logger; 