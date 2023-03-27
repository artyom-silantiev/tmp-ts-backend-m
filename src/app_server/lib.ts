import * as fs from 'fs-extra';

export async function holdBeforeFileExists(
  filePath: string,
  timeout = 2000
): Promise<boolean> {
  timeout = timeout < 1000 ? 1000 : timeout;
  try {
    let nom = 0;
    return new Promise((resolve, reject) => {
      const inter = setInterval(() => {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
          clearInterval(inter);
          //clear timer, even though there's still plenty of time left
          resolve(true);
          return;
        }

        nom = nom + 100;
        if (nom >= timeout) {
          clearInterval(inter);
          //maybe exists, but my time is up!
          reject(new Error('timeout'));
        }
      }, 100);
    });
  } catch (error) {
    throw error;
  }
}
