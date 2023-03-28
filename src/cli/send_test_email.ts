import { defineApplication } from '@core/application';
import { AppMailerModule } from '@modules/app-mailer/app-mailer.module';

defineApplication((ctx) => {
  ctx.onModuleInit(async () => {
    await AppMailerModule.sendEmailService.sendTestEmail();
  });

  return {};
}).run();
