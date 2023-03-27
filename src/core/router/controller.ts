// @Controller

import { CtxHandler, RouteHandler } from './router';

const sController = Symbol('Controller');
export function Controller() {
  return function (target: Function) {
    Reflect.defineMetadata(sController, true, target);
  } as ClassDecorator;
}

// Controller methods decorators

const sControllerHandlers = Symbol('ControllerHandlers');
export type Method =
  | 'USE'
  | 'ALL'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'DELETE';
type ControllerHandler = {
  method: Method;
  path: string;
  key: string | symbol;
};

function controllerHandler(method: Method, path: string) {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (!Reflect.hasMetadata(sControllerHandlers, target)) {
      Reflect.defineMetadata(sControllerHandlers, [], target);
    }

    const controllerHandlers = Reflect.getMetadata(
      sControllerHandlers,
      target
    ) as ControllerHandler[];
    controllerHandlers.push({
      method,
      path,
      key,
    });

    return descriptor;
  } as MethodDecorator;
}

export function All(path: string = '') {
  return controllerHandler('ALL', path);
}

export function Get(path: string = '') {
  return controllerHandler('GET', path);
}

export function Head(path: string = '') {
  return controllerHandler('HEAD', path);
}

export function Options(path: string = '') {
  return controllerHandler('OPTIONS', path);
}

export function Patch(path: string = '') {
  return controllerHandler('PATCH', path);
}

export function Post(path: string = '') {
  return controllerHandler('POST', path);
}

export function Put(path: string = '') {
  return controllerHandler('PUT', path);
}

export function Delete(path: string = '') {
  return controllerHandler('DELETE', path);
}

// controller metadata parser

export function getCtxHandlersFromController(controller: Object) {
  const ctxHandlers = [] as RouteHandler[];

  const controllerHandlers = Reflect.getMetadata(
    sControllerHandlers,
    controller
  ) as ControllerHandler[];
  if (!controllerHandlers || controllerHandlers.length === 0) {
    return ctxHandlers;
  }

  for (const ctrlHandler of controllerHandlers) {
    const controllerHandler = controller[ctrlHandler.key] as () =>
      | Promise<any>
      | any;
    const ctxHandler = controllerHandler.bind(controller) as CtxHandler;

    ctxHandlers.push({
      method: ctrlHandler.method,
      path: ctrlHandler.path,
      ctxHandler: ctxHandler,
    });
  }

  return ctxHandlers;
}
