import { random } from 'lodash';
import * as hasha from 'hasha';

export async function sleep(ms) {
  await new Promise((recolse) => {
    setTimeout(() => {
      recolse(true);
    }, ms);
  });
}

export class Deferred<T> extends Promise<T> {
  public resolve: (T) => void;
  public reject: (any) => void;

  constructor() {
    let resolveSelf, rejectSelf;
    super((resolve, reject) => {
      resolveSelf = resolve;
      rejectSelf = reject;
    });
    this.resolve = resolveSelf;
    this.reject = rejectSelf;
  }
}

export function getRandomItemByWeight(
  items: {
    v: string;
    w: number;
  }[]
) {
  let totalWeight = 0;
  items.forEach((i) => (totalWeight += i.w));
  let rndNum = random(0, totalWeight);
  for (const item of items) {
    if (rndNum <= item.w) {
      return item;
    }
    rndNum -= item.w;
  }
}

export function getRandomString(len?) {
  let str = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  len = len || 8;

  for (let i = 0; i < len; i++) {
    str += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return str;
}

export function getUid() {
  return Date.now().toString(36) + '.' + getRandomString();
}

export function getMimeFromPath(filePath) {
  const execSync = require('child_process').execSync;
  const mimeType = execSync(
    'file --mime-type -b "' + filePath + '"'
  ).toString();
  return mimeType.trim();
}

export async function getFileSha256(filePath: string): Promise<string> {
  await sleep(200);
  return hasha.fromFile(filePath, { algorithm: 'sha256' });
}
