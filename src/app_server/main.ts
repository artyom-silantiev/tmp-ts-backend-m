import bodyParser from 'body-parser';
import { createAppLogger } from '@lib/app_logger';
import { useEnv } from '@lib/env/env';
import routes from './routes';
import express from 'express';
import { defineApplication } from 'minimal2b/application';
import { catchHttpException, initAppRouter } from 'minimal2b/http';

const logger = createAppLogger('App');

const application = defineApplication((ctx) => {
  const env = useEnv();
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  initAppRouter(app, routes);
  app.use(catchHttpException);

  ctx.onModuleInit(() => {
    app.listen(env.NODE_PORT, () => {
      logger.debug('dev env used');
      logger.log('env: ', env);
      logger.log(`app listen port: ${env.NODE_PORT}`);
    });
  });
});

application.run();
