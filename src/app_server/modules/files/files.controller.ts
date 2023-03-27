import { IsString } from 'class-validator';
import { Controller, Ctx, Get, Head } from '@core/router';
import {
  FileMeta,
  FilesOutputService,
} from '@modules/files/files-output.service';
import { FileRequest } from '@modules/files/files_request';

export class ByUidParamDto {
  @IsString()
  uid: string;
}

export class ByUidAndArgsDto {
  @IsString()
  uid: string;

  @IsString()
  args: string;
}

@Controller()
export class FilesController {
  constructor(private filesOutput: FilesOutputService) {}

  parseUid(uidParam: string, query: { [key: string]: string }) {
    let fileRefRequest!: FileRequest;

    let match = uidParam.match(/^([0-9a-fA-Z]*)(\.(\w+))$/);
    if (match) {
      const uid = match[1];
      fileRefRequest = new FileRequest(uid);
      fileRefRequest.format = match[3];
    }

    match = uidParam.match(/^([0-9a-fA-Z]*)(:(\d+))?$/);
    if (!fileRefRequest && match) {
      const uid = match[1];

      fileRefRequest = new FileRequest(uid);

      if (match[3]) {
        const temp = match[3];
        if (!Number.isNaN(temp)) {
          fileRefRequest.thumb = {
            type: 'width',
            name: temp,
          };
        }
      }
    }

    match = uidParam.match(/^([0-9a-fA-Z]*)(:(fullhd))?$/);
    if (!fileRefRequest && match) {
      const uid = match[1];
      fileRefRequest = new FileRequest(uid);
      if (match[3]) {
        fileRefRequest.thumb = {
          type: 'name',
          name: match[3],
        };
      }
    }

    if (!fileRefRequest) {
      fileRefRequest = new FileRequest(uidParam);
    }

    if (query.w) {
      fileRefRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      fileRefRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return fileRefRequest;
  }

  getFileRefByUidAndArgsAndQuery(
    uid: string,
    args: string,
    query: { [key: string]: string }
  ) {
    const fileRequest = new FileRequest(uid);

    const match = args.match(/^(image|video)(\.(\w+))?$/);
    if (match) {
      fileRequest.type = match[1] as 'image' | 'video';
      if (match[3]) {
        fileRequest.format = match[3];
      }
    }

    if (query.w) {
      fileRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      fileRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return fileRequest;
  }

  getHeadersForFile(fileDbMeta: FileMeta) {
    return {
      'Cache-Control': 'public, immutable',
      'Content-Type': fileDbMeta.mime,
      'Content-Length': fileDbMeta.size,
      'Last-Modified': new Date(fileDbMeta.createdAt).toUTCString(),
      ETag: fileDbMeta.sha256,
    };
  }

  @Head(':uid')
  async headByUid(ctx: Ctx) {
    const uid = ctx.req.params['uid'];
    const query = ctx.req.query as { [key: string]: string };
    const fileRefRequest = this.parseUid(uid, query);

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      fileRefRequest
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    ctx.res.status(fileRes.status).set(ipfsCacheItemHeaders);
    ctx.res.send('');
  }

  @Get(':uid')
  async getByUid(ctx: Ctx) {
    const uid = ctx.params['uid'];
    const query = ctx.query as { [key: string]: string };
    const fileRefRequest = this.parseUid(uid, query);

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      fileRefRequest
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    ctx.res.status(fileRes.status).set(ipfsCacheItemHeaders);

    ctx.res.sendFile(fileRes.fileMeta.absPathToFile);
  }

  @Head(':uid/:args')
  async headBySha256AndArgs(ctx: Ctx) {
    const uid = ctx.params['uid'];
    const args = ctx.params['args'];
    const query = ctx.query as { [key: string]: string };
    const localFilesRequest = this.getFileRefByUidAndArgsAndQuery(
      uid,
      args,
      query
    );

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      localFilesRequest
    );

    const fileItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    ctx.res.status(fileRes.status).set(fileItemHeaders);
    ctx.res.send('');
  }

  @Get(':uid/:args')
  async getBySha256AndArgs(ctx: Ctx) {
    const uid = ctx.params['uid'];
    const args = ctx.params['args'];
    const query = ctx.query as { [key: string]: string };
    const localFilesRequest = this.getFileRefByUidAndArgsAndQuery(
      uid,
      args,
      query
    );

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      localFilesRequest
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);

    ctx.res.status(fileRes.status).set(ipfsCacheItemHeaders);
    ctx.res.sendFile(fileRes.fileMeta.absPathToFile);
  }
}
