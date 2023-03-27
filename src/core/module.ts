export const modules = [] as ModuleWrap<unknown>[];

function addAppModule<T>(moduleWrap: ModuleWrap<T>) {
  modules.push(moduleWrap);
}

type LifecycleHandler = () => Promise<void> | void;
type ModuleMeta = {
  items: any[];
  initHandler: LifecycleHandler | null;
  destroyHandler: LifecycleHandler | null;
};
export type ModuleWrap<T> = {
  id: number;
  meta: ModuleMeta;
  module: T;
};

function getModuleSetupCtx(meta: ModuleMeta) {
  return {
    useItems<T extends Object>(items: T) {
      for (const item of Object.values(items)) {
        meta.items.push(item);
      }
      return items;
    },
    onModuleInit(handler: LifecycleHandler) {
      meta.initHandler = handler;
    },
    onModuleDestroy(handler: LifecycleHandler) {
      meta.destroyHandler = handler;
    },
  };
}
type ModuleSetupCtx = ReturnType<typeof getModuleSetupCtx>;

export type ModuleSetup<T> = (ctx: ModuleSetupCtx) => T;

let modulesCount = 0;
export function defineModule<T>(setup: ModuleSetup<T>) {
  const moduleId = modulesCount++;

  const meta = {
    items: [] as any[],
    initHandler: null as null | { (): Promise<void> },
    destroyHandler: null as null | { (): Promise<void> },
  } as ModuleMeta;

  const moduleCtx = getModuleSetupCtx(meta);

  const moduleWrap = {
    id: moduleId,
    meta,
    module: setup(moduleCtx),
  } as ModuleWrap<T>;

  addAppModule(moduleWrap);

  return moduleWrap.module;
}
