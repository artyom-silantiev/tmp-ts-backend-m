import { defineModule } from '@core/module';
import { SendEmailService } from './send-email.service';
import { AppMailerService } from './app-mailer.service';
import { DbModule } from '@db/db.module';

export const AppMailerModule = defineModule((ctx) => {
  const mailerService = new AppMailerService(DbModule.task);
  const sendEmailService = new SendEmailService(mailerService);

  return ctx.useItems({
    mailerService,
    sendEmailService,
  });
});
