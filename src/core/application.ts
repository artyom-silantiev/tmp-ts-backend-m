import { onAppStart, parseItemForGRPC } from './grpc/server';
import { defineModule, ModuleSetup, modules } from './module';

function listenExit() {
  async function exitHandler(options, exitCode) {
    for (const moduleWrap of modules) {
      for (const moduleItem of moduleWrap.meta.items) {
        if (
          typeof moduleItem === 'object' &&
          typeof moduleItem.onModuleDestroy === 'function'
        ) {
          await moduleItem.onModuleDestroy();
        }
      }

      if (moduleWrap.meta.destroyHandler) {
        await moduleWrap.meta.destroyHandler();
      }
    }
  }

  //do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }));

  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
}

export function defineApplication<T>(setup: ModuleSetup<T>) {
  const appModule = defineModule(setup);

  async function run() {
    for (const moduleWrap of modules) {
      if (moduleWrap.meta.initHandler) {
        await moduleWrap.meta.initHandler();
      }

      for (const moduleItem of moduleWrap.meta.items) {
        if (
          typeof moduleItem === 'object' &&
          typeof moduleItem.onModuleInit === 'function'
        ) {
          await moduleItem.onModuleInit();
        }
      }

      moduleWrap.meta.items.forEach((item) => {
        parseItemForGRPC(item);
      });
    }

    onAppStart();

    listenExit();
  }

  return {
    module: appModule,
    run,
  };
}
