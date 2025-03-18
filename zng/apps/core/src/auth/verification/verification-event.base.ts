import { IApplicationUser } from '@library/entity/interface';

export class VerificationEventBase {
  constructor(protected readonly user: IApplicationUser) {}
}
