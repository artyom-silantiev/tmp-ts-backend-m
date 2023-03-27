import { Route } from '@core/router/router';
import { AppModule } from './app.module';
import { AuthGuard } from './guards';
import { AppCtx } from './types';

export default [
  {
    path: 'api',
    controller: AppModule.appController,
  },
  {
    path: 'api/guarded',
    ctxMiddlewares: [AuthGuard],
    handlers: [
      {
        path: 'user',
        method: 'GET',
        ctxHandler: (ctx: AppCtx) => {
          const user = ctx.req.user;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        },
      },
    ],
  },
  {
    path: '',
    static: {
      root: process.cwd() + '/public',
    },
  },
] as Route[];
