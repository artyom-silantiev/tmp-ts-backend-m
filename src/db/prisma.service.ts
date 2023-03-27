import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  async onModuleInit() {
    await this.init();
  }

  async init() {
    try {
      await this.$connect();
    } catch (error) {
      throw error;
    }
  }
}
