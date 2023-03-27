import { PrismaService } from '@db/prisma.service';
import { useBs58 } from '@lib/bs58';
import { FileRef, File, User } from '@prisma/client';

export type FileRefRow = FileRef & {
  users?: User[];
  file?: File;
};

export class FileRefRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.fileRef;
  }

  async createByFile(fileDb: File) {
    const fileLink = await this.prisma.fileRef.create({
      data: {
        uid: useBs58().uid(),
        fileId: fileDb.id,
      },
      include: {
        file: true,
      },
    });

    return fileLink;
  }
}
