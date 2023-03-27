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

  REDIS_HOST = toString(E.REDIS_HOST, 'localhost');
  REDIS_PORT = toInt(E.REDIS_PORT, 6379);
  REDIS_DB = toInt(E.REDIS_DB, 0);

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

export function toArrayStrings(envParam: string, spliter: string, defaultValue: string[]) {
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
