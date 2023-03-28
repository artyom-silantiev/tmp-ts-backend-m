import { GrpcMethod, GrpcService } from '@core/grpc/decorators';
import { BackupsService } from './backups.service';
import { BackupName__Output } from '#grpc/admin/BackupName';
import { Message__Output } from '#grpc/common/Message';
import { BackupInfo__Output } from '#grpc/admin/BackupInfo';

@GrpcService('admin/backups.proto', 'AdminBackups')
// TODO @ACL(AclScopes.allowAdmin)
export class BackupsGrpc {
  constructor(private backupsService: BackupsService) {}

  onModuleInit() {}

  async getBackups() {
    return await this.backupsService.getBackups();
  }

  /*
  @GrpcMethod()
  async downloadBackup(data) {
    const absBackupFile = await this.backupsService.getAbsBackupFile(
      data.name
    );
  }
  */

  @GrpcMethod()
  async createBackup(): Promise<BackupInfo__Output> {
    const backupFileInfo = await this.backupsService.createBackup();
    return backupFileInfo;
  }

  @GrpcMethod()
  async restoreFromBackup(data: BackupName__Output): Promise<Message__Output> {
    await this.backupsService.restoreFromBackup(data.name);
    return {
      message: 'backup restored',
    };
  }

  @GrpcMethod()
  async deleteBackup(data: BackupName__Output): Promise<Message__Output> {
    await this.backupsService.deleteBackupFile(data.name);
    return {
      message: 'backup deleted',
    };
  }

  @GrpcMethod()
  uploadBackup() {
    return '';
    // TODO
  }
}
