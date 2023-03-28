import { metadata } from '@core/metadata';
import { HttpHandler, CtxHandler, Method, RouteHandler } from './types';

const sHttp = Symbol('sHttp');
const sHttpMiddlewares = Symbol('sHttpMiddlewares');
const sHttpHandlers = Symbol('sHttpHandlers');
const sHttpHandler = Symbol('sHttpHandler');

// Controller decorator

export function Controller() {
  return function (target: Function) {
    metadata.set([target, sHttp], true);
  } as ClassDecorator;
}

// CtxMiddlewares decorator
export function HttpMiddlewares(middlewares: CtxHandler[]) {
  return function (target: any, key?: string | symbol) {
    if (key) {
      // method decorator
      metadata.set(
        [target.constructor, sHttpHandlers, key, sHttpMiddlewares],
        middlewares
      );
    } else {
      // class decorator
      metadata.set([target.constructor, sHttpMiddlewares], middlewares);
    }
  };
}

// Controller methods decorators

function httpHandler(method: Method, path: string) {
  return function (target: Object, key: string | symbol) {
    metadata.set([target.constructor, sHttpHandlers, key, sHttpHandler], {
      method,
      path,
      key,
    } as HttpHandler);
  } as MethodDecorator;
}

export function All(path: string = '') {
  return httpHandler('ALL', path);
}

export function Get(path: string = '') {
  return httpHandler('GET', path);
}

export function Head(path: string = '') {
  return httpHandler('HEAD', path);
}

export function Options(path: string = '') {
  return httpHandler('OPTIONS', path);
}

export function Patch(path: string = '') {
  return httpHandler('PATCH', path);
}

export function Post(path: string = '') {
  return httpHandler('POST', path);
}

export function Put(path: string = '') {
  return httpHandler('PUT', path);
}

export function Delete(path: string = '') {
  return httpHandler('DELETE', path);
}

// controller metadata parser

export function parseController(controller: Object) {
  if (!metadata.has([controller.constructor, sHttp])) {
    return null;
  }

  const httpHandlers = metadata.get([
    controller.constructor,
    sHttpHandlers,
  ]) as Map<string, any>;

  const controllerMiddlewares = metadata.get([
    controller.constructor,
    sHttpMiddlewares,
  ]) as CtxHandler[];

  if (!httpHandlers || httpHandlers.size === 0) {
    return null;
  }

  const routeHandlers = [] as RouteHandler[];

  for (const [key, map] of httpHandlers) {
    const httpHandler = map.get(sHttpHandler) as HttpHandler;

    if (!httpHandler) {
      continue;
    }

    const sHttpHandlerMiddlewares = map.get(sHttpMiddlewares) as CtxHandler[];

    const ctxHandler = controller[key].bind(controller) as CtxHandler;

    const routeHandler = {
      method: httpHandler.method,
      path: httpHandler.path,
      handler: ctxHandler,
      middlewares: sHttpHandlerMiddlewares
        ? sHttpHandlerMiddlewares
        : undefined,
      controllerMiddlewares: controllerMiddlewares
        ? controllerMiddlewares
        : undefined,
    } as RouteHandler;

    routeHandlers.push(routeHandler);
  }

  return routeHandlers;
}
