import { FileRequest } from '@modules/files/files_request';
import { useRedis } from '../redis';
import { FileMeta } from '@modules/files/files-output.service';

const prefixKey = 'file';
class CacheFiles {
  getPrefixKey() {
    return prefixKey;
  }
  key(fileReq: FileRequest) {
    let fileCache = `${prefixKey}:${fileReq.uid}`;
    if (fileReq.thumb) {
      fileCache += ':' + fileReq.thumb.name;
    }
    return fileCache;
  }
  async get(lfReq: FileRequest) {
    const cacheKey = this.key(lfReq);
    const fileCacheKey = await useRedis().get(cacheKey);
    return fileCacheKey || null;
  }
  async set(lfReq: FileRequest, fileMeta: FileMeta) {
    const cacheKey = this.key(lfReq);
    await useRedis().set(cacheKey, JSON.stringify(fileMeta), 'EX', 300);
  }
}

let cacheFiles: CacheFiles;
export function useCacheFiles() {
  if (!cacheFiles) {
    cacheFiles = new CacheFiles();
  }
  return cacheFiles;
}
