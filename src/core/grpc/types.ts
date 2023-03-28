import * as grpc from '@grpc/grpc-js';

export class GrpcMetadata {
  private metadata = {} as {
    [key: string]: any;
  };

  constructor(metadata: grpc.Metadata) {
    this.metadata = metadata.getMap();
  }

  has(key: string) {
    return typeof this.metadata[key] !== 'undefined';
  }

  get(key: string) {
    return this.metadata[key];
  }

  set(key: string, value: any) {
    this.metadata[key] = value;
  }

  delete(key: string) {
    delete this.metadata[key];
  }
}

export type GrpcMiddleware = {
  (req: any, metadata: GrpcMetadata): void;
};
export type GrpcCallHandler = {
  (req: any, metadata: GrpcMetadata): any | Promise<any>;
};

export type GrpcServiceMeta = {
  serviceName: string;
  protoFile: string;
};

export enum GrpcCallType {
  Method = 0,
  StreamMethod = 1,
  StreamCall = 2,
}
export type GRPCall = {
  callName: string;
  type: GrpcCallType;
  key: string | symbol;
  middlewares?: GrpcMiddleware[];
};
