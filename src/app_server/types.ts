import { Ctx } from '@core/http/types';
import express from 'express';

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
