import { AuthModule } from './auth.module';
import { UserRole } from '@prisma/client';
import { CtxGrpc, GrpcMiddleware } from 'minimal2b/grpc/types';
import * as grpc from '@grpc/grpc-js';
import { JwtUser } from './types';
import { GrpcMiddlewares } from 'minimal2b/grpc/decorators';
import { GrpcException } from 'minimal2b/grpc/exception';
import { AppUser, AppUserKey } from 'src/app_server/types';

const authMiddleware: GrpcMiddleware = async (ctx: CtxGrpc) => {
  const accessToken = ctx.metadata.get('access-token')[0] as string;

  if (!accessToken) {
    throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
  }

  try {
    const jwtUser = await AuthModule.authService.cheackAccessToken(accessToken);
    ctx.set(AppUserKey, jwtUser as AppUser);
  } catch (error) {
    throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
  }
};

export function AuthGuardGrpc() {
  return GrpcMiddlewares([authMiddleware]);
}

export function RoleGuardGrpc(needRole: UserRole) {
  const roleGuardMiddleware: GrpcMiddleware = (ctx: CtxGrpc) => {
    const user = ctx.get(AppUserKey) as AppUser;

    if (!user || user.role !== needRole) {
      throw new GrpcException('Forbidden', grpc.status.UNAUTHENTICATED);
    }
  };

  return GrpcMiddlewares([authMiddleware, roleGuardMiddleware]);
}
