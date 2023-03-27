import express from 'express';
import { getCtxHandlersFromController, Method } from '../router/controller';
import { createLogger } from '../logger';

const logger = createLogger('Router');

export type ExpHandler = (
  req: express.Request | any,
  res: express.Response,
  next: express.NextFunction
) => Promise<void> | void;
export type CtxHandler = (ctx: Ctx | any) => Promise<any> | any;

export type RouteHandler = {
  path?: string;
  method: Method;
  expHandler?: ExpHandler;
  ctxHandler?: CtxHandler;
};

export type StaticOptions = {
  root: string;
};

export type Route = {
  path: string;
  expMiddlevares?: ExpHandler[];
  ctxMiddlewares?: CtxHandler[];

  handlers?: RouteHandler[];
  controller?: any;
  controllers?: any[];
  subRoutes?: Route[];

  static?: StaticOptions;
};

export type Ctx = ReturnType<typeof getCtx>;
function getCtx(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return {
    body: req.body || null,
    params: req.params || null,
    query: req.query || null,
    headers: req.headers || null,
    req,
    res,
    next,
  };
}

function getExpressRouterMethod(method: Method, expressRouter: express.Router) {
  let expressRouterMethod;

  if (method === 'USE') {
    expressRouterMethod = expressRouter.use;
  } else if (method === 'ALL') {
    expressRouterMethod = expressRouter.all;
  } else if (method === 'GET') {
    expressRouterMethod = expressRouter.get;
  } else if (method === 'HEAD') {
    expressRouterMethod = expressRouter.head;
  } else if (method === 'OPTIONS') {
    expressRouterMethod = expressRouter.options;
  } else if (method === 'PATCH') {
    expressRouterMethod = expressRouter.patch;
  } else if (method === 'POST') {
    expressRouterMethod = expressRouter.post;
  } else if (method === 'PUT') {
    expressRouterMethod = expressRouter.put;
  } else if (method === 'DELETE') {
    expressRouterMethod = expressRouter.delete;
  }

  return expressRouterMethod;
}

function useRouteHandlers(
  routeHandlers: RouteHandler[],
  expressRouter: express.Router,
  routePath: string
) {
  for (const routeHandler of routeHandlers) {
    useRouteHandler(routeHandler, expressRouter, routePath);
  }
}

function useRouteHandler(
  routeHandler: RouteHandler,
  expressRouter: express.Router,
  routePath: string
) {
  if (routeHandler.expHandler) {
    useExpHandler(
      routeHandler.expHandler,
      routeHandler,
      expressRouter,
      routePath
    );
  }
  if (routeHandler.ctxHandler) {
    useCtxHandler(routeHandler, expressRouter, routePath);
  }
}

function useCtxHandler(
  routeHandler: RouteHandler,
  expressRouter: express.Router,
  routePath: string
) {
  const expHandler: ExpHandler = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const ctx = getCtx(req, res, next);
      const resData = await (routeHandler.ctxHandler as CtxHandler)(ctx);
      if (typeof resData === 'undefined') {
        return;
      }
      if (typeof resData === 'string') {
        res.send(resData);
      } else {
        res.json(resData);
      }
    } catch (error) {
      next(error);
    }
  };

  useExpHandler(expHandler, routeHandler, expressRouter, routePath);
}

function useExpHandler(
  handler: ExpHandler,
  routeHandler: RouteHandler,
  expressRouter: express.Router,
  routePath: string
) {
  const expressMethod = getExpressRouterMethod(
    routeHandler.method,
    expressRouter
  );

  let path = '';
  if (routeHandler.path) {
    if (!routeHandler.path.startsWith('/') && routeHandler.path.length > 0) {
      routeHandler.path = '/' + routeHandler.path;
    }
    path = routeHandler.path;
  }

  if (routeHandler.method === 'USE') {
    expressMethod.apply(expressRouter, [handler]);
  } else {
    expressMethod.apply(expressRouter, [path, handler]);
  }

  logger.log(`${routeHandler.method} ${(routePath + path).replace('//', '/')}`);
}

function parseRoutes(
  app: express.Application | express.Router,
  routes: Route[],
  path: string = '',
  level: number = 0
) {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  for (const route of routes) {
    if (route.path.startsWith('/')) {
      route.path = route.path.substring(1);
    }

    let appIsApp = true;
    if (Object.getPrototypeOf(app) == express.Router) {
      appIsApp = false;
    }
    const expressRouter = express.Router();

    const routePath = path + route.path;
    logger.log(`RouterPath:"${routePath}", deep:${level}`);

    if (route.expMiddlevares) {
      for (const middleware of route.expMiddlevares) {
        expressRouter.use(middleware);
      }
    }

    if (route.ctxMiddlewares) {
      for (const ctxMiddleware of route.ctxMiddlewares) {
        useRouteHandler(
          {
            method: 'USE',
            ctxHandler: ctxMiddleware,
          },
          expressRouter,
          routePath
        );
      }
    }

    if (route.handlers) {
      useRouteHandlers(route.handlers, expressRouter, routePath);
    }

    if (route.controller) {
      const ctxHandlers = getCtxHandlersFromController(route.controller);
      useRouteHandlers(ctxHandlers, expressRouter, routePath);
    }

    if (route.controllers) {
      for (const controller of route.controllers) {
        const ctxHandlers = getCtxHandlersFromController(controller);
        useRouteHandlers(ctxHandlers, expressRouter, routePath);
      }
    }

    if (route.subRoutes) {
      parseRoutes(expressRouter, route.subRoutes, routePath, level + 1);
    }

    if (route.static) {
      app.use(express.static(route.static.root));
      logger.log(`STATIC ${routePath} => ${route.static.root}`);
    }

    if (appIsApp) {
      (app as express.Application).use(routePath, expressRouter);
    } else {
      (app as express.Router).use(routePath, expressRouter);
    }
  }
}

export function initAppRouter(app: express.Application, routes: Route[]) {
  parseRoutes(app, routes, '', 0);
}
