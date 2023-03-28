export class Metadata {
  private METADATA = new Map<any, any>();

  has(keySet: any[]): boolean {
    let map = this.METADATA;

    for (let i = 0; i < keySet.length; i++) {
      const key = keySet[i];

      if (i === keySet.length - 1) {
        return map.has(key);
      } else {
        if (map.has(key)) {
          map = map.get(key);
        } else {
          return false;
        }
      }
    }

    return false;
  }

  set(keySet: any[], value: any) {
    let map = this.METADATA;

    for (let i = 0; i < keySet.length; i++) {
      const key = keySet[i];

      if (i === keySet.length - 1) {
        map.set(key, value);
        return value;
      } else {
        if (!map.has(key)) {
          const newMap = new Map();
          map.set(key, newMap);
          map = newMap;
        } else {
          map = map.get(key);
        }
      }
    }
  }

  get(keySet: any[]) {
    let metadata = this.METADATA;

    for (let i = 0; i < keySet.length; i++) {
      const key = keySet[i];

      if (i === keySet.length - 1) {
        return metadata.get(key) || null;
      } else {
        if (metadata.has(key)) {
          metadata = metadata.get(key);
        } else {
          return null;
        }
      }
    }
  }
}

export const metadata = new Metadata();
