import { defineConfig, Options } from 'tsup';
import { resolve } from 'path';

const apps = {
  server: {
    entry: resolve(__dirname, 'src', 'app_server', 'main.ts'),
  },
} as {
  [appName: string]: AppBuildInfo;
};

type AppBuildInfo = {
  entry: string;
};

export default defineConfig(() => {
  let appsToBuild = [] as string[];
  const appName = process.env.BUILD_APP;
  if (appName) {
    appsToBuild = [appName];
  } else {
    appsToBuild = Object.keys(apps);
  }

  const config = {} as Options;
  config.entry = {};

  for (const appName of appsToBuild) {
    const app = apps[appName] as AppBuildInfo;
    const appBundleName = `${appName}`;
    config.entry[appBundleName] = app.entry;
  }

  return config;
});
