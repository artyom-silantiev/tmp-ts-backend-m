import { defineModule } from 'minimal2b/module';
import { BackupsGrpc } from './backups.grpc';
import { BackupsService } from './backups.service';

export const AdminBackupsModule = defineModule((ctx) => {
  const backupsService = new BackupsService();
  const backupsGrpc = new BackupsGrpc(backupsService);

  return ctx.useItems({
    backupsService,
    backupsGrpc,
  });
});
