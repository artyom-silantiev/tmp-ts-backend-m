import express from 'express';
import { ValidateException } from '../validator';

export class HttpException extends Error {
  constructor(public message: string | any, public status: number) {
    super();
  }
}

export function catchHttpException(
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (error instanceof ValidateException) {
    error = new HttpException(error.message, 422);
  }

  if (error instanceof HttpException) {
    res.status(error.status);

    if (typeof error.message === 'string') {
      res.json({
        status: error.status,
        message: error.message,
      });
    } else {
      res.json(error.message);
    }
  } else {
    res.status(500).send('Something went wrong');
  }
}
