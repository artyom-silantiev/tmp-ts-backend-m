import { LogLevel, Logger, setGlobalLogLevel } from 'minimal2b/logger';
import { useEnv } from './env/env';

if (useEnv().isDevEnv()) {
  setGlobalLogLevel(LogLevel.TRACE);
} else {
  setGlobalLogLevel(LogLevel.INFO);
}

export class AppLogger extends Logger {
  constructor(name: string) {
    super({ name });
  }
}

export function createAppLogger(name: string) {
  return new AppLogger(name);
}
