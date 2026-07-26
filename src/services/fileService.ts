import fs from 'fs/promises';
import path from 'path';
import { TMP_DIR } from '../constant/config.js';

const SAFE_DIRECTORIES = [TMP_DIR];

function isInsideSafeDir(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return SAFE_DIRECTORIES.some(dir => resolved.startsWith(dir));
}

export async function cleanup(filePaths: string[]): Promise<void> {
  const results = await Promise.allSettled(
    filePaths
      .filter(isInsideSafeDir)
      .map(async (filePath) => {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          await fs.unlink(filePath);
        }
      })
  );

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`cleanup: ${failures.length} file(s) failed to delete`, failures);
  }
}
