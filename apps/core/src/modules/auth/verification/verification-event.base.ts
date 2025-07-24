import { IZngOldEvent } from '@library/shared/common/event/interface/i-zng-old-event';
import { ApplicationUser } from '@library/shared/domain/entity';

export class VerificationEventBase implements IZngOldEvent {
  public readonly name: string;
  public isExternal: boolean = false;

  constructor(protected readonly user: ApplicationUser, name: string) {
    this.name = name;
  }
}
