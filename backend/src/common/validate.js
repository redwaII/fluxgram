import { ZodError } from 'zod';
import { AppError } from './errors.js';

export function parseBody(schema, body) {
  try {
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new AppError(400, 'Validation failed', e.flatten());
    }
    throw e;
  }
}
