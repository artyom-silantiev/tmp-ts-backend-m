import { DbModule } from '@db/db.module';
import { TaskRepository } from '@db/repositories/task.repository';
import { useEnv } from '@lib/env/env';
import { AppMailerModule } from '@modules/app-mailer/app-mailer.module';
import {
  AppMailerService,
  SendEmailParams,
} from '@modules/app-mailer/app-mailer.service';
import { TaskType } from '@prisma/client';
import { defineModule } from 'minimal2b/module';
import { Cron, QueueJob } from 'minimal2b/schedule';

const env = useEnv();

@Cron()
class AppCronService {
  constructor(
    private taskRepository: TaskRepository,
    private mailer: AppMailerService
  ) {}

  @QueueJob(1000 * env.MAILER_QUEUE_DELAY_SEC)
  async sendEmailsFromTasks() {
    const taskTypes = [TaskType.SEND_EMAIL];
    const attemptes = env.MAILER_QUEUE_ATTEMPTS;
    const packSize = env.MAILER_QUEUE_PACK_SIZE;
    await this.taskRepository.handleWrapPack<SendEmailParams>(
      taskTypes,
      attemptes,
      async (ctx) => {
        await this.mailer.sendEmailNow(ctx.task.data);
      },
      packSize
    );
  }
}

export const AppCronModule = defineModule((ctx) => {
  const appCronService = new AppCronService(
    DbModule.task,
    AppMailerModule.mailerService
  );

  ctx.useItems({ appCronService });
});
