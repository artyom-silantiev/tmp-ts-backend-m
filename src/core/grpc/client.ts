import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve } from 'path';

export class GrpcProto<TGrpcProto> {
  private proto: TGrpcProto;

  constructor(protoFileName: string) {
    const options = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    };
    const protoFile = resolve(process.cwd(), 'grpc', protoFileName);
    const packageDefinition = protoLoader.loadSync(protoFile, options);
    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    this.proto = proto as TGrpcProto;
  }

  getService<ServiceType>(addr: string, serviceName: string) {
    const ClientProto = this.proto[
      serviceName
    ] as grpc.ServiceClientConstructor;
    const client = new ClientProto(addr, grpc.credentials.createInsecure());
    return client as ServiceType;
  }
}
