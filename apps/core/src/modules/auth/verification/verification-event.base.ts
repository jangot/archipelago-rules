import { IApplicationUser } from '@library/entity/entity-interface';

export class VerificationEventBase {
  constructor(protected readonly user: IApplicationUser) {}
}
