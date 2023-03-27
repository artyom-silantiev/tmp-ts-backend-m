import * as moment from 'moment';

export enum LogLevel {
  FATAL = -1,
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}
let globalLogLevel = LogLevel.INFO;

export class Logger {
  name = '';
  logLevel: LogLevel;

  constructor(params?: { name?: string; logLevel?: LogLevel }) {
    params = params || {};
    this.name = params.name || '';
    this.logLevel = params.logLevel || globalLogLevel;
  }

  printName() {
    if (this.name) {
      return '[' + this.name + ']';
    } else {
      return '';
    }
  }

  printNow() {
    return moment.utc().format('YYYY-MM-DD HH:mm:ss');
  }

  // FATAL
  fatal(...args: any) {
    console.error(this.printNow(), '[FATAL]', this.printName(), ...args);
  }

  // ERROR
  error(...args: any) {
    console.error(this.printNow(), '[ERROR]', this.printName(), ...args);
  }

  // WARN
  warn(...args: any) {
    if (this.logLevel < LogLevel.WARN) {
      return;
    }
    console.log(this.printNow(), '[WARN]', this.printName(), ...args);
  }

  // INFO
  info(...args: any) {
    if (this.logLevel < LogLevel.INFO) {
      return;
    }
    console.log(this.printNow(), '[INFO]', this.printName(), ...args);
  }
  log(...args: any) {
    if (this.logLevel < LogLevel.INFO) {
      return;
    }
    console.log(this.printNow(), '[INFO]', this.printName(), ...args);
  }

  // DEBUG
  debug(...args: any) {
    if (this.logLevel < LogLevel.DEBUG) {
      return;
    }
    console.log(this.printNow(), '[DEBUG]', this.printName(), ...args);
  }

  // TRACE
  trace(...args: any) {
    if (this.logLevel < LogLevel.TRACE) {
      return;
    }
    console.log(this.printNow(), '[TRACE]', this.printName(), ...args);
  }
}

export function setGlobalLogLevel(logLevel: LogLevel) {
  globalLogLevel = logLevel;
}

export function createLogger(name) {
  return new Logger(name);
}
