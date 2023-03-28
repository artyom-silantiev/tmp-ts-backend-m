import { resolve } from 'path';
import {
  GRPCall,
  GrpcCallType,
  GrpcMiddleware,
  GrpcServiceMeta,
} from './types';
import { metadata } from '@core/metadata';

// GrpcService decorator
export const sGrpcServiceBase = Symbol('sGrpcServiceBase');
export const sGrpcServiceMiddlewares = Symbol('sGrpcServiceMiddlewares');
export const sGrpcServiceCalls = Symbol('sGrpcServiceCalls');

export function GrpcService(protoFileName: string, serviceName: string) {
  return function (target: Function) {
    const protoFile = resolve(process.cwd(), 'grpc', protoFileName);

    metadata.set([target, sGrpcServiceBase], {
      serviceName,
      protoFile,
    } as GrpcServiceMeta);
  } as ClassDecorator;
}

// GrpcCall's decorators
export const sGrpcCallBase = Symbol('gRPC_Call');
export const sGrpcCallMiddlewares = Symbol('gRPC_CallMiddlewares');

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

    metadata.set([target.constructor, sGrpcServiceCalls, key, sGrpcCallBase], {
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
        [target.constructor, sGrpcServiceCalls, key, sGrpcCallMiddlewares],
        middlewares
      );
    } else {
      // class decorator
      metadata.set([target, sGrpcServiceMiddlewares], middlewares);
    }
  };
}
