import { TaskRepository } from '@db/repositories/task.repository';
import { SendEmailType, useEnv } from '@lib/env/env';
import { TaskType } from '@prisma/client';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { Cron, QueueJob } from 'minimal2b/schedule';
import * as fs from 'fs-extra';

const env = useEnv();
const EmailTemplatesDir = path.join(process.cwd(), 'assets', 'views', 'email');

export type SendEmailParams = nodemailer.SendMailOptions & {
  template?: string;
  context?: any;
};

@Cron()
export class AppMailerService {
  private mailer: nodemailer.Transporter;

  constructor(private taskRepository: TaskRepository) {}

  onModuleInit() {
    const env = useEnv();

    this.mailer = nodemailer.createTransport({
      host: env.MAILER_SMTP_HOST,
      port: env.MAILER_SMTP_PORT,
      secure: env.MAILER_SMTP_SECURE,
      sender: env.MAILER_DEFAULT_SENDER,
      auth: {
        user: env.MAILER_SMTP_AUTH_USER,
        pass: env.MAILER_SMTP_AUTH_PASS,
      },
    });
  }

  @QueueJob(1000 * 15)
  private async tasksSendEmail() {
    const taskTypes = [TaskType.SEND_EMAIL];
    const attemptes = env.MAILER_QUEUE_ATTEMPTS;
    const packSize = env.MAILER_QUEUE_PACK_SIZE;
    await this.taskRepository.handleWrapPack<SendEmailParams>(
      taskTypes,
      attemptes,
      async (ctx) => {
        await this.sendEmailNow(ctx.task.data);
      },
      packSize
    );
  }

  private renderTemplate(params: SendEmailParams) {
    if (!params.template) {
      return;
    }

    if (!params.template.endsWith('.hbs')) {
      params.template += '.hbs';
    }

    const templateCode = fs.readFileSync(params.template);
    const template = Handlebars.compile(templateCode.toString());
    const renderResult = template(params.context || {});
    return renderResult;
  }

  private async sendEmailNow(params: SendEmailParams) {
    if (params.template) {
      params.html = this.renderTemplate(params);
    }

    return this.mailer.sendMail(params);
  }

  private async sendEmailTask(params: SendEmailParams) {
    await this.taskRepository.taskCreate(TaskType.SEND_EMAIL, params);
  }

  async sendEmail(params: SendEmailParams) {
    if (params.template) {
      params.template = path.join(EmailTemplatesDir, params.template);
    }

    if (env.MAILER_SEND_EMAIL_TYPE === SendEmailType.sync) {
      return await this.sendEmailNow(params);
    } else if (env.MAILER_SEND_EMAIL_TYPE === SendEmailType.queue) {
      await this.sendEmailTask(params);
    }
  }
}
