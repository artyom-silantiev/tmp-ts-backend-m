import { validate } from 'class-validator';
import { Class } from './types';

export class ValidateException extends Error {
  constructor(public message: string | any) {
    super();
  }
}

export async function validateDto<T>(data: any, Dto: Class<T>) {
  const dto = new Dto();
  const validateObject = Object.assign(dto as any, data);

  const errors = await validate(validateObject);

  if (errors.length > 0) {
    const validateErrors = [] as {
      field: string;
      code: string;
      message: string;
    }[];

    for (const error of errors) {
      if (error.constraints) {
        for (const code of Object.keys(error.constraints)) {
          validateErrors.push({
            field: error.property,
            code,
            message: error.constraints[code],
          });
        }
      }
    }

    throw new ValidateException(validateErrors);
  }

  return validateObject as T;
}
