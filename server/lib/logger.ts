/**
 * Simple structured JSON logger for improved production observability.
 * Replaces standard console.log with JSON payloads that logging agents can parse.
 */
export const logger = {
  info: (msg: string, ctx?: Record<string, any>) => {
    console.info(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), msg, ...ctx }));
  },
  warn: (msg: string, ctx?: Record<string, any>) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), msg, ...ctx }));
  },
  error: (msg: string, ctx?: Record<string, any>) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), msg, ...ctx }));
  },
  debug: (msg: string, ctx?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'debug', timestamp: new Date().toISOString(), msg, ...ctx }));
    }
  }
};
