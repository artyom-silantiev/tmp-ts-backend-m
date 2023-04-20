import { FilesModule } from '@modules/files/files.module';
import { FilesController } from './files.controller';
import { defineModule } from 'minimal2b/module';

export const FilesHttpModule = defineModule((ctx) => {
  const filesController = new FilesController(FilesModule.filesOutputService);

  return ctx.useItems({ filesController });
});
