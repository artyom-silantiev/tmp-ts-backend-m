import {
  GrpcMethod,
  GrpcService,
  GrpcStreamCall,
  GrpcStreamMethod,
} from '@core/grpc/decorators';
import { GrpcProto } from '@core/grpc/client';
import { GrpcMetadata, GrpcMiddleware } from '@core/grpc/types';
import { ProtoGrpcType as AppGrpcProto } from '#grpc/app_grpc';
import { AppGrpcClient } from '#grpc/AppGrpc';
import { ChatMsg, ChatMsg__Output } from '#grpc/ChatMsg';

import { GrpcException } from '@core/grpc/catch_grpc_error';
import { validateDto } from '@core/validator';
import { LoginDto } from './app.controller';
import * as grpc from '@grpc/grpc-js';
import { resolve } from 'path';
import * as fs from 'fs-extra';
import { useEnv } from '@lib/env/env';
import { holdBeforeFileExists } from './lib';
import { Stream } from 'stream';

const env = useEnv();

const rtcAuthGuard: GrpcMiddleware = (req, metadata: GrpcMetadata) => {
  metadata.get('access-token');

  if (metadata.has('access-token')) {
    metadata.set('user', {
      userId: '1',
      name: 'Bob',
    });
  } else {
    throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
  }
};

@GrpcService('app_grpc.proto', 'AppGrpc')
export class AppGrpc {
  client: AppGrpcClient;

  constructor() {
    const proto = new GrpcProto<AppGrpcProto>('app_grpc.proto');
    this.client = proto.getService<AppGrpcClient>('localhost:8080', 'AppGrpc');
  }

  @GrpcMethod()
  hello(call) {
    return {
      message: `Hello, ${call.name || 'World'}!`,
    };
  }

  @GrpcMethod()
  throw() {
    throw new GrpcException(
      {
        msg: 'Bad news everone',
      },
      10
    );
  }

  @GrpcMethod()
  async login(call) {
    const body = await validateDto(call, LoginDto);

    return {
      accessToken: (Math.random() * 1e6 + 1e6).toString(32),
    };
  }

  @GrpcMethod({
    middlewares: [rtcAuthGuard],
  })
  async getProfile(call, meta: GrpcMetadata) {
    console.log('meta', meta);
    return meta.get('user');
  }

  @GrpcMethod()
  async uploadFileTest() {
    const file = resolve(__dirname, '../', 'README.md');

    const res = await new Promise((resolve, reject) => {
      const clientCall = this.client.uploadFile(function (error, response) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
      clientCall.write({
        info: {
          name: 'README.md',
        },
      });
      const rs = fs.createReadStream(file);
      rs.on('data', (chunk) => {
        clientCall.write({
          chunk: chunk,
        });
      });
      rs.on('end', () => {
        clientCall.end();
      });
    });

    return res;
  }

  @GrpcStreamCall()
  async uploadFile(stream: Stream) {
    fs.mkdirsSync(env.DIR_TEMP);
    const tmp = resolve(env.DIR_TEMP, Date.now().toString());
    const ws = fs.createWriteStream(tmp);
    let name = '';

    await new Promise((resolve, reject) => {
      stream.on('data', (payload) => {
        console.log('payload', payload);
        if (payload.data === 'info') {
          name = payload.info.name;
        } else {
          ws.write(payload.chunk);
        }
      });
      stream.on('end', () => {
        console.log('end');
        ws.end();
        resolve(true);
      });
    });

    const targetFile = resolve(env.DIR_TEMP, name);
    fs.removeSync(targetFile);
    fs.renameSync(tmp, targetFile);

    await holdBeforeFileExists(targetFile);
    const stat = fs.statSync(targetFile);

    return {
      size: stat.size,
    };
  }

  @GrpcMethod()
  async chatTest() {
    const client = this.client.chat();

    await new Promise((resolve, reject) => {
      client.write({
        msg: 1,
      });
      client.on('data', (chunk: ChatMsg__Output) => {
        console.log('bbb chunk', chunk);

        if (chunk.msg >= 10) {
          resolve(true);
        } else {
          client.write({
            msg: chunk.msg + 1,
          });
        }
      });
      client.on('error', (error) => {
        reject(error);
      });
      client.on('end', () => {
        console.log('bbb end');
        resolve(true);
      });
    });

    client.end();
    console.log('client chat call end');
  }

  @GrpcStreamMethod()
  async chat(client: grpc.ClientDuplexStream<ChatMsg, ChatMsg__Output>) {
    await new Promise((resolve, reject) => {
      client.on('data', (chunk: ChatMsg__Output) => {
        console.log('aaa chunk', chunk);
        client.write({
          msg: chunk.msg + 1,
        });
      });
      client.on('error', (error) => {
        reject(error);
      });
      client.on('end', () => {
        console.log('aaa end');
        resolve(true);
      });
    });

    client.end();
    console.log('server chat method end');
  }
}
