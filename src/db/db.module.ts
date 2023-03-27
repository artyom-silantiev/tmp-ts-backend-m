import { defineModule } from '@core/module';
import { PrismaService } from './prisma.service';
import { FileRefRepository } from './repositories/file_ref.repository';
import { FileRepository } from './repositories/file.repository';
import { JwtRepository } from './repositories/jwt.repository';
import { SettingRepository } from './repositories/setting.repository';
import { TaskRepository } from './repositories/task.repository';
import { UserRepository } from './repositories/user.repository';

export const DbModule = defineModule((ctx) => {
  const prisma = new PrismaService();

  const fileRef = new FileRefRepository(prisma);
  const file = new FileRepository(prisma);
  const jwt = new JwtRepository(prisma);
  const setting = new SettingRepository(prisma);
  const task = new TaskRepository(prisma);
  const user = new UserRepository(prisma);

  return ctx.uses({
    prisma,

    fileRef,
    file,
    jwt,
    setting,
    task,
    user,
  });
});
