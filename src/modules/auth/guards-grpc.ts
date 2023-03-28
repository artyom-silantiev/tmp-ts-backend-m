import { AuthModule } from './auth.module';
import { UserRole } from '@prisma/client';
import { GrpcMiddleware } from '@core/grpc/types';
import { GrpcException } from '@core/grpc/catch_grpc_error';
import * as grpc from '@grpc/grpc-js';
import { JwtUser } from './types';

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
  return [authMiddleware];
}

export function RoleGuardGrpc(needRole: UserRole) {
  const roleGuardMiddleware: GrpcMiddleware = (req: any, metadata) => {
    const user = metadata.get(GrpcMetaUserKey) as JwtUser;

    if (!user || user.role !== needRole) {
      throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
    }
  };

  return [authMiddleware, roleGuardMiddleware];
}
