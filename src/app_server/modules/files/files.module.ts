import { FilesModule } from '@modules/files/files.module';
import { FilesController } from './files.controller';
import { defineModule } from '@core/module';

export const FilesHttpModule = defineModule((ctx) => {
  const filesControoler = new FilesController(FilesModule.filesOutputService);

  return ctx.useItems({ filleControoler: filesControoler });
});