import { JwtUser } from './types';
import { AuthModule } from './auth.module';
import { UserRole } from '@prisma/client';
import {
  HttpException,
  HttpMiddlewares,
  HttpStatus,
  CtxHandler,
  CtxHttp,
} from 'minimal2b/http';
import { AppUser, AppUserKey } from 'src/app_server/types';

const authMiddleware: CtxHandler = async (ctx: CtxHttp) => {
  const bearerHeader = ctx.headers.authorization;
  const accessToken = bearerHeader && bearerHeader.split(' ')[1];

  if (!bearerHeader || !accessToken) {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  let jwtUser!: JwtUser;
  try {
    jwtUser = await AuthModule.authService.cheackAccessToken(accessToken);
    ctx.set(AppUserKey, jwtUser as AppUser);
  } catch (error) {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  ctx.next();
};

export function AuthGuardHttp() {
  return HttpMiddlewares([authMiddleware]);
}

export function RoleGuardHttp(needRole: UserRole) {
  const roleGuardMiddleware: CtxHandler = (ctx: CtxHttp) => {
    const user = ctx.get(AppUserKey) as AppUser;
    if (!user || user.role !== needRole) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    ctx.next();
  };

  return HttpMiddlewares([authMiddleware, roleGuardMiddleware]);
}
