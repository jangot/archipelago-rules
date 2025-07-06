import { IApplicationUser } from '@library/entity/entity-interface';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';

export class VerificationEventBase implements IZngEvent {
  public readonly name: string;
  public isExternal: boolean = false;

  constructor(protected readonly user: IApplicationUser, name: string) {
    this.name = name;
  }
}
