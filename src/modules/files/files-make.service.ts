import { File, MediaType } from '@prisma/client';

import moment from 'moment';
import sharp from 'sharp';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { FileRepository } from '@db/repositories/file.repository';
import { PrismaService } from '@db/prisma.service';
import { ThumbParam } from './files_request';
import { FilesDefs } from './defs';
import { FileWrap } from './types';
import { FileMeta } from './files-output.service';
import { useEnv } from '@lib/env/env';
import { useBs58 } from '@lib/bs58';
import { getFileSha256, getMimeFromPath } from '@lib/helpers';
import { getMediaContentProbe } from '@lib/ffmpeg';
import { HttpException } from 'minimal2b/http';

export class FilesMakeService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private prisma: PrismaService,
    private filesRepository: FileRepository
  ) {}

  async createFileDb(
    tempFile: string,
    params?: {
      thumbData?: {
        orgFileDbId: bigint;
        name: string;
      };
      noValidation?: boolean;
    }
  ): Promise<FileWrap> {
    const fileSha256Hash = await getFileSha256(tempFile);

    let fileWrap: FileWrap;

    try {
      fileWrap = await this.filesRepository.getFileDbBySha256(fileSha256Hash);
      if (fileWrap) {
        await fs.remove(tempFile);
        return { ...fileWrap, ...{ status: 208 } };
      }
    } catch {}

    const mime = await getMimeFromPath(tempFile);
    const fstat = await fs.stat(tempFile);

    let contentType = MediaType.OTHER as MediaType;
    if (_.startsWith(mime, 'image/')) {
      contentType = MediaType.IMAGE;
    } else if (_.startsWith(mime, 'audio/')) {
      contentType = MediaType.AUDIO;
    } else if (_.startsWith(mime, 'video/')) {
      contentType = MediaType.VIDEO;
    }

    let size = null as null | number;
    let width = null as null | number;
    let height = null as null | number;
    let duration = null as null | number;
    let frameRate = 0;

    if (contentType === MediaType.IMAGE) {
      const imageInfo = await sharp(tempFile).metadata();
      size = fstat.size;
      width = imageInfo.width as number;
      height = imageInfo.height as number;
    } else if (contentType === MediaType.AUDIO) {
      const fileProbe = await getMediaContentProbe(tempFile);

      if (fileProbe.audioStreams) {
        const stream = fileProbe.audioStreams[0];
        size = fileProbe.format.size || 0;
        duration = parseFloat(stream.duration || '0');
      }
    } else if (contentType === MediaType.VIDEO) {
      const fileProbe = await getMediaContentProbe(tempFile);
      if (fileProbe.videoStreams) {
        const stream = fileProbe.videoStreams[0];
        size = fileProbe.format.size || 0;
        width = stream.width || 0;
        height = stream.height || 0;
        duration = parseFloat(stream.duration || '0');
        frameRate = parseFloat(stream.r_frame_rate || '0');
      }
    }

    if (!params || !params.noValidation) {
    }

    if (params && params.thumbData) {
      if (contentType !== MediaType.IMAGE) {
        await fs.remove(tempFile);
        throw new HttpException('bad org content type for create thumb', 500);
      }
    }

    const now = moment();
    const year = now.format('YYYY');
    const month = now.format('MM');
    const day = now.format('DD');
    const locaFiles = FilesDefs.DIR;
    const locDirForFile = path.join(year, month, day);
    const absDirForFile = path.resolve(locaFiles, locDirForFile);
    const locPathToFile = path.join(locDirForFile, fileSha256Hash);
    const absPathToFile = path.resolve(absDirForFile, fileSha256Hash);
    await fs.mkdirs(absDirForFile);
    await fs.move(tempFile, absPathToFile, { overwrite: true });

    const file = await this.prisma.file.create({
      data: {
        sha256: fileSha256Hash,
        mime,
        size: size || 0,
        width,
        height,
        durationSec: Math.floor(duration || 0),
        pathToFile: locPathToFile,
        type: contentType,
      },
    });

    fileWrap = {
      status: 201,
      file: file,
    };

    return fileWrap;
  }

  async createNewThumbForLocalFile(
    orgFile: File,
    thumb: ThumbParam,
    thumbFile: {
      file: string;
      meta: string;
    }
  ) {
    const tempNewThumbImageFile = path.resolve(
      this.env.DIR_TEMP,
      this.bs58.uid() + '.thumb.jpg'
    );
    const absFilePath = path.resolve(FilesDefs.DIR, orgFile.pathToFile);
    const image = sharp(absFilePath);
    const metadata = await image.metadata();

    let info!: sharp.OutputInfo;

    if (thumb.type === 'width') {
      info = await image
        .resize(parseInt(thumb.name || ''))
        .jpeg({ quality: 50 })
        .toFile(tempNewThumbImageFile);
    } else if (thumb.type === 'name') {
      if (thumb.name === 'fullhd') {
        if (
          metadata.height &&
          metadata.width &&
          metadata.height > metadata.width
        ) {
          info = await image
            .resize({ height: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        } else {
          info = await image
            .resize({ width: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        }
      }
    }

    const thumbDir = thumbFile.file.replace(/^(.*)\/.*$/, '$1');
    await fs.mkdirs(thumbDir);
    await fs.move(tempNewThumbImageFile, thumbFile.file);
    const sha256 = await getFileSha256(thumbFile.file);
    const thumbMeta = {
      absPathToFile: thumbFile.file,
      contentType: MediaType.IMAGE,
      mime: 'image/jpeg',
      size: info.size || 0,
      width: info.width || 0,
      height: info.height || 0,
      durationSec: null,
      sha256: sha256,
      isThumb: true,
      orgId: orgFile.id.toString(),
      createdAt: new Date().toISOString(),
    } as FileMeta;
    await fs.writeJSON(thumbFile.meta, thumbMeta);

    return thumbMeta;
  }
}
