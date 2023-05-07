import { DbModule } from '@db/db.module';
import { GuestGrpc } from './guest.grpc';
import { defineModule } from 'minimal2b/module';
import { AuthModule } from '@modules/auth/auth.module';
import { AppMailerModule } from '@modules/app-mailer/app-mailer.module';
import { JwtModule } from '@modules/jwt/jwt.module';

export const GuestModule = defineModule((ctx) => {
  const guestGrpc = new GuestGrpc(
    DbModule.prisma,
    DbModule.user,
    AuthModule.authService,
    AppMailerModule.sendEmailService,
    JwtModule.jwtUserActivationService,
    JwtModule.jwtUserRecoveryService
  );

  return ctx.useItems({ guestGrpc });
});
