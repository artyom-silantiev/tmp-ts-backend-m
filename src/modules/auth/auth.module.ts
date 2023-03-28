import { defineModule } from '@core/module';
import { AuthService } from './auth.service';
import { DbModule } from '@db/db.module';
import { JwtModule } from '@modules/jwt/jwt.module';

export const AuthModule = defineModule((ctx) => {
  const authService = new AuthService(
    DbModule.prisma,
    DbModule.user,
    JwtModule.jwtUserAuthService
  );

  return ctx.useItems({
    authService,
  });
});
