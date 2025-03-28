import { IExpressRequestUser } from './express.user.types';

declare global {
  namespace Express {
    export interface Request {
      user?: IExpressRequestUser | undefined;
    }
  }
}

export {}; // This makes the file a module.
