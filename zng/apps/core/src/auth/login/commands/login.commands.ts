import { ContactType } from '@library/entity/enum';

export class LoginCommand {
  constructor(
    public readonly userId?: string,
    public readonly contact?: string,
    public readonly contactType?: ContactType
  ) {}
}
