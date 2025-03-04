import { LoginType, RegistrationStage, RegistrationType } from '@library/entity/enum';
import { RegistrationDto } from '../../dto';
import { IDataService } from '../../data/idata.service';
import { RegistrationStageTransition } from './stage-transition.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Login } from '../../data/entity';

export abstract class RegistratorBase<Type extends RegistrationType, Payload extends RegistrationDto & { type: Type }> {
  protected abstract stageTransitions: RegistrationStageTransition[];
  protected abstract supportedRegistrationLogins: LoginType[];

  constructor(
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService,
    protected readonly usersService: UsersService
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async advance(input: Payload, _token: string | null): Promise<unknown> {
    if (!input) {
      throw new Error('No input provided');
    }
    const { userId } = input;
    // Initial step of registration
    if (!userId) {
      const transition = this.stageTransitions.find((t) => !t.from);
      if (!transition) {
        throw new Error('No initial transition found');
      }
      return this.next(transition.to, undefined, undefined, input);
    }

    // All other registration steps for multi-step registrations
    //const tokenPayload = this.jwtService.decode(token) as { id: string };

    const registration = await this.getRegistrationState(userId);
    const transition = this.stageTransitions.find((t) => t.from === registration?.stage);
    if (!transition) {
      throw new Error(`No transition found from ${registration?.stage}`);
    }
    return this.next(transition.to, registration?.stage, userId, input);
  }

  protected async getRegistrationState(userId: string | null): Promise<Login | null> {
    if (!userId) return null;
    const unfinishedRegistration = await this.data.logins.getFirstUnfinished(userId, this.supportedRegistrationLogins);

    return unfinishedRegistration;
  }

  protected next(
    targetStage: RegistrationStage,
    currentStage?: RegistrationStage,
    id?: string,
    input?: Payload
  ): Promise<unknown> {
    const transition = this.stageTransitions.find((t) => t.to === targetStage && t.from === currentStage);
    if (!transition) {
      throw new Error(`No transition found from ${currentStage} to ${targetStage}`);
    }
    return transition.action(id, input);
  }
}
