import { JwtUser } from './types';
import { AuthModule } from './auth.module';
import { UserRole } from '@prisma/client';
import { HttpException, HttpMiddlewares, HttpStatus } from '@core/http';
import { Ctx, CtxHandler } from '@core/http/types';

export type CtxWithUser = Ctx & {
  user: JwtUser;
};

const authMiddleware: CtxHandler = async (ctx: CtxWithUser) => {
  const bearerHeader = ctx.headers.authorization;
  const accessToken = bearerHeader && bearerHeader.split(' ')[1];

  if (!bearerHeader || !accessToken) {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  let jwtUser!: JwtUser;
  try {
    jwtUser = await AuthModule.authService.cheackAccessToken(accessToken);
    ctx.user = jwtUser;
  } catch (error) {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  ctx.next();
};

export function AuthGuardHttp() {
  return HttpMiddlewares([authMiddleware]);
}

export function RoleGuardHttp(needRole: UserRole) {
  const roleGuardMiddleware: CtxHandler = (ctx: CtxWithUser) => {
    if (!ctx.user || ctx.user.role !== needRole) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    ctx.next();
  };

  return HttpMiddlewares([authMiddleware, roleGuardMiddleware]);
}
