import { EntityId } from '@library/shared/common/data';

export enum AuthSecretType {
  PASSWORD = 'password',
  TOTP = 'totp',
  APPLE = 'apple',
}

export interface IAuthSecret extends EntityId<string> {
  id: string;
  type: AuthSecretType;
  ownerId: string;
  secret: string;
  expiresAt?: Date;
  // externalId?: string; // For case if Auth Provider needs to store some one more key
  // details?: Record<string, unknown>; // For case if Auth Provider needs to store some more data (json-like)
}
