import { Ctx } from 'minimal2b/http/types';
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
