import { DbModule } from '@db/db.module';
import { FilesInputService } from './files-input.service';
import { FilesMakeService } from './files-make.service';
import { FilesOutputService } from './files-output.service';
import { defineModule } from '@core/module';

export const FilesModule = defineModule((ctx) => {
  const filesMakeService = new FilesMakeService(DbModule.prisma, DbModule.file);
  const filesInputService = new FilesInputService(
    DbModule.fileRef,
    filesMakeService
  );
  const filesOutputService = new FilesOutputService(
    DbModule.prisma,
    DbModule.file,
    filesMakeService
  );

  return ctx.uses({
    filesMakeService,
    filesInputService,
    filesOutputService,
  });
});
