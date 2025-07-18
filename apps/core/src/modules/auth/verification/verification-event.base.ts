import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { ApplicationUser } from '@library/shared/domain/entity';

export class VerificationEventBase implements IZngEvent {
  public readonly name: string;
  public isExternal: boolean = false;

  constructor(protected readonly user: ApplicationUser, name: string) {
    this.name = name;
  }
}
