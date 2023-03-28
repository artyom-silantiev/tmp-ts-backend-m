import { FilesMakeService } from './files-make.service';
import { FileRefRepository } from '@db/repositories/file_ref.repository';

export class FilesInputService {
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
