import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class CacheStore {
  public store = new Map<string, number>();

  constructor(public fileName: string, public enabled: boolean = false, public cacheClear: boolean = false) {
    if (this.enabled && !this.cacheClear) {
      if (existsSync(fileName)) {
        this.store = new Map(Object.entries(JSON.parse(readFileSync(fileName, 'utf-8'))));
      }
    }
  }

  public shouldParseFile(path: string) {
    if (!this.enabled) {
      return true;
    } else {
      const mtime = statSync(path).mtime.getTime();
      const currentMtime = this.store.get(path);
      if (currentMtime && mtime === currentMtime) {
        return false;
      }
    }
    return true;
  }

  public cacheFile(path: string) {
    const mtime = statSync(path).mtime.getTime();
    this.store.set(path, mtime);
  }

  public save() {
    if (this.enabled) {
      mkdirSync(dirname(this.fileName), { recursive: true });
      writeFileSync(this.fileName, JSON.stringify(Object.fromEntries(this.store)), 'utf-8');
    }
  }
}
