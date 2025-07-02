export interface IExpressRequestUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
}

export interface ILogoutUser  {
  userId: string;
  sessionId: string;
}

export interface IRefreshTokenUser {
  userId: string;
  secret: string;
}

export interface IRequest extends Request {
  user?: IExpressRequestUser | undefined;
}

export interface ILogoutRequest extends Request {
  user?: ILogoutUser | undefined;
}

export interface IRefreshTokenRequest extends Request {
  user?: IRefreshTokenUser | undefined;
}
