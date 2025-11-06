const LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  success: 'OK',
};

export function logInfo(message) {
  console.log(`[${LEVELS.info}] ${message}`);
}

export function logWarn(message) {
  console.warn(`[${LEVELS.warn}] ${message}`);
}

export function logError(message) {
  console.error(`[${LEVELS.error}] ${message}`);
}

export function logSuccess(message) {
  console.log(`[${LEVELS.success}] ${message}`);
}
