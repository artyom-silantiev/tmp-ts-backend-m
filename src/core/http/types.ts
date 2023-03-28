import express from 'express';

export type Ctx = ReturnType<typeof getCtx>;
export function getCtx(
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

export type ExpHandler = (
  req: express.Request | any,
  res: express.Response,
  next: express.NextFunction
) => Promise<void> | void;

export type CtxHandler = (ctx: Ctx | any) => Promise<any> | any;

export type RouteHandler = {
  path?: string;
  method: Method;
  handler: CtxHandler;
  middlewares?: CtxHandler[];
  controllerMiddlewares?: CtxHandler[];
};

export type StaticOptions = {
  root: string;
};

export type Route = {
  path: string;
  middlewares?: CtxHandler[];

  handler?: RouteHandler;
  controller?: any;
  controllers?: any[];

  subRoutes?: Route[];

  static?: StaticOptions;
};

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

export type HttpHandler = {
  method: Method;
  path: string;
  key: string | symbol;
};
