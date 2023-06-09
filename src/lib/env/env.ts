import * as dotenv from 'dotenv';
import * as path from 'path';
import { shSync } from '@lib/sh';
import * as fs from 'fs-extra';

// set NODE_HOST if app running in docker container
if (fs.existsSync('/.dockerenv')) {
  process.env.NODE_HOST = shSync('hostname').replace('\n', '');
}

dotenv.config();

export enum NodeEnvType {
  development = 'development',
  production = 'production',
}

export enum NodeRole {
  MASTER = 'MASTER',
  WORKER = 'WORKER',
}

export enum SendEmailType {
  sync = 'sync',
  queue = 'queue',
}

export enum Protocol {
  http = 'http',
  https = 'https',
}

export enum NodeAppType {
  APP = 'APP',
}

export enum ClusterAppType {
  Cli = 'cli',
  Server = 'server',
}

const E = process.env;

let onlyDefault = false;

const NODE_APP_INDEX = toInt(E.NODE_APP_INDEX, 0);
const NODE_APP_TYPE = toEnum(E.NODE_APP_TYPE, Object.values(NodeAppType), NodeAppType.APP);

export class Env {
  NODE_ENV = toEnum(E.NODE_ENV, Object.values(NodeEnvType), NodeEnvType.development) as NodeEnvType;
  NODE_PORT = toInt(E.NODE_PORT, 3000, true);
  NODE_PORT_GRTC = toInt(E.NODE_PORT_GRTC, 8080, true);
  NODE_HOST = toString(E.NODE_HOST, 'localhost');
  NODE_PROTOCOL = toEnum(E.NODE_PROTOCOL, Object.values(Protocol), Protocol.http) as Protocol;
  NODE_APP_INDEX = NODE_APP_INDEX;
  NODE_APP_TYPE = NODE_APP_TYPE;
  NODE_CLUSTER_APP_TYPE = toEnum(E.NODE_CLUSTER_APP_TYPE, Object.values(ClusterAppType), ClusterAppType.Server) as ClusterAppType;
  NODE_ROLE = toEnum(E.NODE_ROLE, Object.values(NodeRole), NodeRole.MASTER) as NodeRole;

  DIR_DATA = toPath(E.DIR_DATA, './data/data');
  DIR_TEMP = toPath(E.DIR_TEMP, './data/temp');

  SECRET_PASSWORD_SALT = toString(E.SECRET_PASSWORD_SALT, 'SECRET_PASSWORD_SALT');
  SECRET_JWT_AUTH = toString(E.SECRET_JWT_AUTH, 'jwtActivationSec');
  SECRET_JWT_ACTIVATION = toString(E.SECRET_JWT_ACTIVATION, 'jwtActivationSec');
  SECRET_JWT_RECOVERY = toString(E.JWT_RECOVERY_SECRET, 'jwtUserRecovery');

  JWT_AUTH_TTL_SEC = toInt(E.JWT_AUTH_TTL_SEC, 28800);
  JWT_ACTIVATION_TTL_SEC = toInt(E.JWT_ACTIVATION_TTL_SEC, 60 * 60 * 24 * 90);
  JWT_RECOVERY_TTL_SEC = toInt(E.JWT_RECOVERY_TTL_SEC, 60 * 60 * 8);

  DATABASE_URL = toString(E.DATABASE_URL, 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public');
  POSTGRES_HOST = toString(E.POSTGRES_HOST, 'tmp-cool-db');
  POSTGRES_DB = toString(E.POSTGRES_DB, 'appdb');
  POSTGRES_USER = toString(E.POSTGRES_USER, 'postgres');
  POSTGRES_PASSWORD = toString(E.POSTGRES_PASSWORD, 'postgres');

  REDIS_HOST = toString(E.REDIS_HOST, 'localhost');
  REDIS_PORT = toInt(E.REDIS_PORT, 6379);
  REDIS_DB = toInt(E.REDIS_DB, 0);

  FRONT_MAIN_PROTOCOL = toEnum(E.FRONT_MAIN_PROTOCOL, Object.values(Protocol), Protocol.http) as Protocol;
  FRONT_MAIN_HOST = toString(E.FRONT_MAIN_HOST, 'example.com');

  MAILER_SEND_EMAIL_TYPE = toEnum(E.MAILER_SEND_EMAIL_TYPE, Object.values(SendEmailType), SendEmailType.sync) as SendEmailType;
  MAILER_QUEUE_DELAY_SEC = toInt(E.MAILER_QUEUE_DELAY_SEC, 10);
  MAILER_QUEUE_ATTEMPTS = toInt(E.MAILER_QUEUE_ATTEMPTS, 3);
  MAILER_QUEUE_PACK_SIZE = toInt(E.MAILER_QUEUE_PACK_SIZE, 3);
  MAILER_DEFAULT_SENDER = toString(E.MAILER_DEFAULT_SENDER, 'No remply <noreply-dev@site.local>');
  MAILER_SMTP_HOST = toString(E.MAILER_SMTP_HOST, 'localhost');
  MAILER_SMTP_PORT = toInt(E.MAILER_SMTP_PORT, 1025);
  MAILER_SMTP_SECURE = toBool(E.MAILER_SMTP_SECURE, false);
  MAILER_SMTP_AUTH_USER = toString(E.MAILER_SMTP_AUTH_USER, '');
  MAILER_SMTP_AUTH_PASS = toString(E.MAILER_SMTP_AUTH_PASS, '');

  // LOCAL_FILES
  LOCAL_FILES_CACHE_MIN_THUMB_LOG_SIZE = toInt(E.LOCAL_FILES_CACHE_MIN_THUMB_LOG_SIZE, 5);
  LOCAL_FILES_IMAGE_MAX_SIZE = toInt(E.LOCAL_FILES_IMAGE_MAX_SIZE, 1024 * 1024 * 8); // 8mb
  LOCAL_FILES_ALLOW_MIME_TYPES = toArrayStrings(E.LOCAL_FILES_ALLOW_MIME_TYPES, ',', ['image/jpeg', 'image/png']);
  LOCAL_FILES_AUDIO_MAX_SIZE = toInt(E.LOCAL_FILES_AUDIO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  LOCAL_FILES_AUDIO_ALLOW_MIME_TYPES = toArrayStrings(E.LOCAL_FILES_AUDIO_ALLOW_MIME_TYPES, ',', ['audio/mp3']);
  LOCAL_FILES_VIDEO_MAX_SIZE = toInt(E.LOCAL_FILES_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  LOCAL_FILES_VIDEO_ALLOW_MIME_TYPES = toArrayStrings(E.LOCAL_FILES_VIDEO_ALLOW_MIME_TYPES, ',', ['video/mp4']);

  isDevEnv() {
    return this.NODE_ENV === NodeEnvType.development;
  }

  isMasterNode() {
    return this.NODE_ROLE === NodeRole.MASTER;
  }

  private getBaseProtocol(protocol: Protocol) {
    if (protocol === Protocol.http) {
      return 'http:';
    } else {
      return 'https:';
    }
  }

  getNodeProtocol() {
    return this.getBaseProtocol(this.NODE_PROTOCOL);
  }
}

export function getDefaultEnv() {
  onlyDefault = true;
  const defaultEnv = new Env();
  onlyDefault = false;
  return defaultEnv;
}

export function toString(envParam: string | undefined, defaultValue: string) {
  if (onlyDefault) {
    return defaultValue;
  }
  return envParam ? envParam : defaultValue;
}

export function toInt(envParam: string | undefined, defaultValue: number, isIncrement = false) {
  let resValue = 0;

  if (envParam) {
    const tmp = parseInt(envParam);
    if (Number.isInteger(tmp)) {
      resValue = tmp;
    } else {
      resValue = defaultValue;
    }
  } else {
    resValue = defaultValue;
  }

  if (onlyDefault) {
    resValue = defaultValue;
  }

  if (isIncrement) {
    resValue += NODE_APP_INDEX;
  }

  return resValue;
}

export function toBool(envParam: string | undefined, defaultValue: boolean) {
  if (onlyDefault) {
    return defaultValue;
  }
  if (envParam === '0' || envParam === 'false') {
    return false;
  } else if (envParam === '1' || envParam === 'true') {
    return true;
  } else {
    return defaultValue;
  }
}

export function toEnum(envParam: string | undefined, enumValues: string[], defaultValue: string) {
  if (!envParam || onlyDefault) {
    return defaultValue;
  }
  return enumValues.indexOf(envParam) >= 0 ? envParam : defaultValue;
}

export function toArrayStrings(envParam: string | undefined, spliter: string, defaultValue: string[]) {
  if (onlyDefault) {
    return defaultValue;
  }
  if (envParam) {
    try {
      const values = envParam.split(spliter);
      return values;
    } catch (error) {}
  }
  return defaultValue;
}

export function _parsePath(pathParam: string) {
  if (pathParam.startsWith('./') || pathParam.startsWith('../')) {
    return path.resolve(process.cwd(), pathParam);
  } else if (pathParam.startsWith('/')) {
    return pathParam;
  } else {
    return '';
  }
}
export function toPath(envParam: string | undefined, defaultPathValue: string) {
  if (!envParam || onlyDefault) {
    return defaultPathValue;
  }

  let path = '';

  if (envParam) {
    const tmp = _parsePath(envParam);
    if (tmp) {
      path = tmp;
    } else {
      path = _parsePath(defaultPathValue);
    }
  } else {
    path = _parsePath(defaultPathValue);
  }

  /*
  const NAI = NODE_APP_INDEX.toString();
  const NAT = NODE_APP_TYPE;
  const NAF = NAT + '_' + NAI;

  path = path.replaceAll('{NAI}', NAI);
  path = path.replaceAll('{NAT}', NAT);
  path = path.replaceAll('{NAF}', NAF);
  */

  return path;
}

const env = new Env();
export function useEnv() {
  return env;
}
