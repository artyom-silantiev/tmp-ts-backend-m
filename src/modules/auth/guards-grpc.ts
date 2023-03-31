import { AuthModule } from './auth.module';
import { UserRole } from '@prisma/client';
import { GrpcMiddleware } from 'minimal2b/grpc/types';
import * as grpc from '@grpc/grpc-js';
import { JwtUser } from './types';
import { GrpcMiddlewares } from 'minimal2b/grpc/decorators';
import { GrpcException } from 'minimal2b/grpc/exception';

export const GrpcMetaUserKey = 'GrpcMetaUserKey';

const authMiddleware: GrpcMiddleware = async (req: any, metadata) => {
  metadata.get('access-token');

  const accessToken = metadata.get('access-token');

  if (!accessToken) {
    throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
  }

  try {
    const jwtUser = await AuthModule.authService.cheackAccessToken(accessToken);
    metadata.set(GrpcMetaUserKey, jwtUser);
  } catch (error) {
    throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
  }
};

export function AuthGuardGrpc() {
  return GrpcMiddlewares([authMiddleware]);
}

export function RoleGuardGrpc(needRole: UserRole) {
  const roleGuardMiddleware: GrpcMiddleware = (req: any, metadata) => {
    const user = metadata.get(GrpcMetaUserKey) as JwtUser;

    if (!user || user.role !== needRole) {
      throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
    }
  };

  return GrpcMiddlewares([authMiddleware, roleGuardMiddleware]);
}
