import { resolve } from 'path';
import { GRPCall, GrpcCallType, GrpcMiddleware } from './types';

// GrpcService decorator
export const sGrpcService = Symbol('sGrpcService');
export function GrpcService(protoFileName: string, serviceName: string) {
  return function (target: Function) {
    const protoFile = resolve(process.cwd(), 'grpc', protoFileName);

    if (!Reflect.hasMetadata(sGrpcService, target)) {
      Reflect.defineMetadata(sGrpcService, {}, target);
    }
    const gRpcServiceMeta = Reflect.getMetadata(sGrpcService, target);

    gRpcServiceMeta.serviceName = serviceName;
    gRpcServiceMeta.protoFile = protoFile;
  } as ClassDecorator;
}

// GrpcServiceMiddlewares decorator
export function GrpcServiceMiddlewares(middlewares: GrpcMiddleware[]) {
  return function (target: Function) {
    if (!Reflect.hasMetadata(sGrpcService, target)) {
      Reflect.defineMetadata(sGrpcService, {}, target);
    }
    const gRpcServiceMeta = Reflect.getMetadata(sGrpcService, target);

    gRpcServiceMeta.middlewares = middlewares;
  } as ClassDecorator;
}

// GrpcCall's decorators
export const sGrpcCall = Symbol('gRPC_Call');

function GrpcBaseDecorator(
  type: GrpcCallType,
  params?: {
    callName?: string;
    middlewares?: GrpcMiddleware[];
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

    if (!Reflect.hasMetadata(sGrpcCall, target)) {
      Reflect.defineMetadata(sGrpcCall, [], target);
    }

    const calls = Reflect.getMetadata(sGrpcCall, target) as GRPCall[];
    calls.push({
      callName,
      type,
      key,
      middlewares: params.middlewares || [],
    });

    return descriptor;
  } as MethodDecorator;
}

export function GrpcMethod(params?: {
  callName?: string;
  middlewares?: GrpcMiddleware[];
}) {
  return GrpcBaseDecorator(GrpcCallType.Method, params);
}

export function GrpcStreamMethod(params?: {
  callName?: string;
  middlewares?: GrpcMiddleware[];
}) {
  return GrpcBaseDecorator(GrpcCallType.StreamMethod, params);
}

export function GrpcStreamCall(params?: {
  callName?: string;
  middlewares?: GrpcMiddleware[];
}) {
  return GrpcBaseDecorator(GrpcCallType.StreamCall, params);
}
