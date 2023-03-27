import { defineModule } from '@core/module';
import { DbModule } from '@db/db.module';
import { ClearDataService } from './clear-data.service';

export const ClearDataModule = defineModule((ctx) => {
  const clearDataService = new ClearDataService(DbModule.prisma);

  return ctx.uses({
    clearDataService,
  });
});
