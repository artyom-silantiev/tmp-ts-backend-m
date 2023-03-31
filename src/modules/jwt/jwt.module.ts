import { DbModule } from '@db/db.module';
import { JwtUserActivationService } from './jwt-user-activation.service';
import { JwtUserAuthService } from './jwt-user-auth.service';
import { JwtUserRecoveryService } from './jwt-user-recovery.service';
import { defineModule } from 'minimal2b/module';

export const JwtModule = defineModule((ctx) => {
  const jwtUserAuthService = new JwtUserAuthService(DbModule.jwt);
  const jwtUserActivationService = new JwtUserActivationService(DbModule.jwt);
  const jwtUserRecoveryService = new JwtUserRecoveryService(DbModule.jwt);

  return ctx.useItems({
    jwtUserAuthService,
    jwtUserActivationService,
    jwtUserRecoveryService,
  });
});
