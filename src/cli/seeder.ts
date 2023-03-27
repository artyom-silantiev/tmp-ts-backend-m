import { defineApplication } from '@core/application';
import { DbModule } from '@db/db.module';
import { PrismaService } from '@db/prisma.service';
import { UserRepository, UserViewType } from '@db/repositories/user.repository';
import { sleep } from '@lib/helpers';
import { UserRole } from '@prisma/client';
import yargs from 'yargs';

interface Seed {
  name: string;
  handle: () => Promise<void>;
}

export class SeederCommand {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository
  ) {}

  async seeder() {
    const seeds = [
      {
        name: '0001_create_admin',
        handle: () => {
          return this.seedCreateAdmin();
        },
      },
    ] as Seed[];

    const usedSeeds = await this.prisma.seed.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    const usedSeedsMap = {} as { [seedName: string]: boolean };
    for (const usedSeedName of usedSeeds) {
      console.log(`${usedSeedName.seed} - seed is used`);
      usedSeedsMap[usedSeedName.seed] = true;
    }

    for (const seed of seeds) {
      if (!usedSeedsMap[seed.name]) {
        const seedName = seed.name;
        console.log(`${seedName} - new seed!`);
        await seed.handle();
        await this.prisma.seed.create({
          data: {
            seed: seedName,
          },
        });
      }
    }

    process.exit(0);
  }

  async seedCreateAdmin() {
    const data = await this.userRepository.createUser({
      password: 'password',
      email: 'admin@example.com',
      emailActivatedAt: new Date(),
      role: UserRole.ADMIN,
      firstName: 'ADMIN',
      lastName: 'POWER',
      phone: '+79001002020',
    });

    console.log(
      'admin create:',
      this.userRepository.toView(data.user, UserViewType.PRIVATE)
    );
  }
}

defineApplication((ctx) => {
  const argv = yargs(process.argv);

  const seederCommand = new SeederCommand(DbModule.prisma, DbModule.user);

  ctx.uses({
    seederCommand,
  });

  ctx.onModuleInit(async () => {
    console.log('Run seeder command...');

    await seederCommand.seeder();

    process.exit(0);
  });
}).run();
