import { resolve } from 'path';
import {
  GRPCall,
  GrpcCallType,
  GrpcMiddleware,
  GrpcServiceMeta,
} from './types';
import { metadata } from '@core/metadata';

// symbols
export const sGrpcMiddlewares = Symbol('sGrpcMiddlewares');
export const sGrpcService = Symbol('sGrpcService');
export const sGrpcServiceCalls = Symbol('sGrpcServiceCalls');
export const sGrpcCall = Symbol('sGrpcCall');

// GrpcService decorator

export function GrpcService(protoFileName: string, serviceName: string) {
  return function (target: Function) {
    const protoFile = resolve(process.cwd(), 'grpc', protoFileName);

    metadata.set([target, sGrpcService], {
      serviceName,
      protoFile,
    } as GrpcServiceMeta);
  } as ClassDecorator;
}

// GrpcCall's decorators

function GrpcBaseDecorator(
  type: GrpcCallType,
  params?: {
    callName?: string;
  }
) {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    params = params || {};
    let callName: string;
    if (params.callName) {
      callName = params.callName;
    } else if (typeof key === 'string') {
      callName = key;
    } else {
      throw new Error('no value for call name');
    }

    metadata.set([target.constructor, sGrpcServiceCalls, key, sGrpcCall], {
      callName,
      type,
      key,
    } as GRPCall);
  } as MethodDecorator;
}

export function GrpcMethod(callName?: string) {
  return GrpcBaseDecorator(GrpcCallType.Method, { callName });
}

export function GrpcStreamMethod(callName?: string) {
  return GrpcBaseDecorator(GrpcCallType.StreamMethod, { callName });
}

export function GrpcStreamCall(callName?: string) {
  return GrpcBaseDecorator(GrpcCallType.StreamCall, { callName });
}

// GrpcMiddlewares decorator
export function GrpcMiddlewares(middlewares: GrpcMiddleware[]) {
  return function (target: any, key?: string | symbol) {
    if (key) {
      // method decorator
      metadata.set(
        [target.constructor, sGrpcServiceCalls, key, sGrpcMiddlewares],
        middlewares
      );
    } else {
      // class decorator
      metadata.set([target, sGrpcMiddlewares], middlewares);
    }
  };
}
