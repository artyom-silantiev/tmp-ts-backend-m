import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { catchGrpcException } from './exception';
import { createLogger } from '../logger';
import {
  GRPCall,
  GrpcCallType,
  GrpcServiceMeta,
  GrpcMetadata,
  GrpcMiddleware,
} from './types';
import {
  sGrpcCallBase,
  sGrpcCallMiddlewares,
  sGrpcServiceBase,
  sGrpcServiceMiddlewares,
  sGrpcServiceCalls,
} from './decorators';
import { metadata } from '@core/metadata';

let grpcServer: grpc.Server;
let globalMiddlewares = [] as GrpcMiddleware[];
const logger = createLogger('gRPC');

export function parseItemForGRPC(grpcService: any) {
  const grpcServiceMeta = metadata.get([
    grpcService.constructor,
    sGrpcServiceBase,
  ]) as GrpcServiceMeta;

  if (!grpcServiceMeta) {
    return;
  }

  const grpcServiceCalls = metadata.get([
    grpcService,
    sGrpcServiceCalls,
  ]) as Map<string, Map<symbol, any>>;
  const grpcServiceMiddlewares = metadata.get([
    grpcService,
    sGrpcServiceMiddlewares,
  ]) as GrpcMiddleware[];

  let calls = [] as GRPCall[];
  if (grpcServiceCalls) {
    for (const key of grpcServiceCalls.keys()) {
      const grpcCall = metadata.get([
        grpcService,
        sGrpcServiceCalls,
        key,
        sGrpcCallBase,
      ]) as GRPCall;

      const grpcCallMiddlewares = metadata.get([
        grpcService,
        sGrpcServiceCalls,
        key,
        sGrpcCallMiddlewares,
      ]) as GrpcMiddleware[];

      if (grpcCall) {
        if (grpcCallMiddlewares) {
          grpcCall.middlewares = grpcCallMiddlewares;
        }

        calls.push(grpcCall);
      }
    }
  }

  useGrpcService(
    grpcServiceMeta,
    grpcService,
    grpcServiceMiddlewares || [],
    calls
  );
}

export function onAppStart() {
  if (grpcServer) {
    const port = process.env.NODE_PORT_GRTC || '8080';
    grpcServer.bindAsync(
      `127.0.0.1:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        console.log(`gRPC server running at http://127.0.0.1:${port}`);
        grpcServer.start();
      }
    );
  }
}

function useGrpcService<T>(
  grpcServiceMeta: GrpcServiceMeta,
  service: any,
  serviceMiddlewares: GrpcMiddleware[],
  calls: GRPCall[]
) {
  if (!grpcServer) {
    grpcServer = new grpc.Server();
  }

  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  } as protoLoader.Options;
  const { protoFile, serviceName } = grpcServiceMeta;

  const packageDefinition = protoLoader.loadSync(protoFile, options);
  const proto = grpc.loadPackageDefinition(packageDefinition) as any;

  logger.log(`use gRPC service ${serviceName}`);

  const callsHandlers = {};
  calls.forEach((call) => {
    callsHandlers[call.callName] = async function (req, callback) {
      const metadata = new GrpcMetadata(req.metadata);

      try {
        for (const midd of globalMiddlewares) {
          midd(req.request, metadata);
        }
        for (const midd of (serviceMiddlewares || []) as GrpcMiddleware[]) {
          midd(req.request, metadata);
        }
        for (const midd of (call.middlewares || []) as GrpcMiddleware[]) {
          midd(req.request, metadata);
        }
      } catch (error) {
        catchGrpcException(error, callback);
      }

      const handler = service[call.key].bind(service);
      try {
        if (call.type === GrpcCallType.Method) {
          const res = await handler(req.request, metadata);
          callback(null, res);
        } else if (call.type === GrpcCallType.StreamCall) {
          const res = await handler(req, metadata);
          callback(null, res);
        } else if (call.type === GrpcCallType.StreamMethod) {
          await handler(req, metadata);
        }
      } catch (error) {
        catchGrpcException(error, callback);
      }
    };

    logger.log(`use gRPC call ${call.callName} for service ${serviceName}`);
  });

  grpcServer.addService(proto[serviceName].service, callsHandlers);
}

export function setGlobalRtcMiddlweares(middlewares: GrpcMiddleware[]) {
  globalMiddlewares = middlewares;
}
