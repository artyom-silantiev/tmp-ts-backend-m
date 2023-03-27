import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { FilesMakeService } from './files-make.service';
import { FileRefRepository } from '@db/repositories/file_ref.repository';
import { useEnv } from '@lib/env/env';
import { useBs58 } from '@lib/bs58';

export class FilesInputService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private fileRefRepository: FileRefRepository,
    private filesMake: FilesMakeService
  ) {}

  async init() {}

  async uploadImageByFile(imageFile: string) {
    const fileWrap = await this.filesMake.createFileDb(imageFile);

    const imageRef = await this.fileRefRepository.createByFile(fileWrap.file);

    return { status: 201, imageRef };
  }
}
