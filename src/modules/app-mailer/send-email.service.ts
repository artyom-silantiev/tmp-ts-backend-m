import { useEnv } from '@lib/env/env';
import { AppMailerService } from './app-mailer.service';
import { I18NextModule } from '@modules/i18next/i18next.module';

const env = useEnv();
const i18next = I18NextModule.useI18Next();

export class SendEmailService {
  constructor(private readonly mailer: AppMailerService) {}

  async sendUserRegistration(params: {
    activationToken: string;
    userEmail: string;
    userPassword: string;
  }) {
    const subject = await i18next('emails.registration.subject', {
      site: env.FRONT_MAIN_HOST,
    });
    const activationUrl = `${env.FRONT_MAIN_PROTOCOL}://${env.FRONT_MAIN_HOST}/activation?code=${params.activationToken}`;

    await this.mailer.sendEmail({
      template: 'registration',
      to: params.userEmail,
      subject: subject,
      context: {
        site: env.FRONT_MAIN_HOST,
        email: params.userEmail,
        code: params.userEmail,
        link: activationUrl,
        password: params.userPassword,
        status: 'activation',
      },
    });
  }

  async sendUserPasswordRecovery(params: {
    recoveryToken: string;
    userEmail: string;
  }) {
    const subject = await i18next('emails.recovery.subject', {
      site: env.FRONT_MAIN_HOST,
    });
    const recoveryUrl = `${env.FRONT_MAIN_PROTOCOL}://${env.FRONT_MAIN_HOST}/recovery?code=${params.recoveryToken}`;

    await this.mailer.sendEmail({
      template: 'recovery',
      to: params.userEmail,
      subject: subject,
      context: {
        email: params.userEmail,
        code: params.recoveryToken,
        link: recoveryUrl,
      },
    });
  }

  async sendUserChangeEmail(params: {
    activationToken: string;
    userEmail: string;
  }) {
    const subject = await i18next('emails.change_email.subject', {
      site: env.FRONT_MAIN_HOST,
    });
    const activationUrl = `${env.FRONT_MAIN_PROTOCOL}://${env.FRONT_MAIN_HOST}/activation?code=${params.activationToken}`;

    await this.mailer.sendEmail({
      template: 'change_email',
      to: params.userEmail,
      subject: subject,
      context: {
        email: params.userEmail,
        code: params.activationToken,
        link: activationUrl,
      },
    });
  }

  async sendAdminUserSignUpNotify(data: {
    userEmail: string;
    userPhone: string;
    userTitle: string;
    userSite: string;
  }) {
    const adminEmail = 'admin@localhost';
    if (!adminEmail) {
      return;
    }

    const subject = await i18next('emails.signup_notify.subject', {
      site: env.FRONT_MAIN_HOST,
    });

    await this.mailer.sendEmail({
      template: 'signup_notify',
      to: adminEmail,
      subject: subject,
      context: {
        site: env.FRONT_MAIN_HOST,
        email: data.userEmail,
        phone: data.userPhone,
        title: data.userTitle,
        userSite: data.userSite,
      },
    });
  }

  async sendTestEmail() {
    await this.mailer.sendEmail({
      template: 'test_email',
      to: 'test@localhost.local',
      subject: 'Test email',
      context: {
        message: 'Hello! ' + Date.now(),
      },
    });
  }
}
