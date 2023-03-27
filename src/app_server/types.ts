import express from 'express';
import { Ctx } from '@core/router/router';

export type AppReq = express.Request & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type AppCtx = Ctx & {
  req: AppReq;
};
