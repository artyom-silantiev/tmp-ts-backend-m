import { useCronService } from '@core/cron';
import { defineModule } from '@core/module';
import { AppGrpc } from './app.grpc';
import { AppController } from './app.controller';
import { AppCronService } from './app_cron.service';

export const AppModule = defineModule((ctx) => {
  const appController = new AppController();
  const cronService = new AppCronService();
  const appGrpc = new AppGrpc();

  ctx.onModuleInit(() => {
    useCronService(cronService);
  });

  return ctx.uses({
    appController,
    cronService,
    appGrpc,
  });
});
