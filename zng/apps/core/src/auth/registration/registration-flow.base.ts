import { LoginType, RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { RegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../dto';
import { IDataService } from '../../data/idata.service';
import { RegistrationStageTransition } from './stage-transition.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationEvent, VerificationEventFactory } from '../verification';
import { EventBus } from '@nestjs/cqrs';
import { IApplicationUser } from '@library/entity/interface';

export abstract class RegistrationFlow<
  Type extends RegistrationType,
  Payload extends RegistrationDto & { type: Type },
> {
  protected abstract stageTransitions: RegistrationStageTransition[];
  protected abstract supportedRegistrationLogins: LoginType[]; // TODO: Remove

  constructor(
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService,
    protected readonly eventBus: EventBus
  ) {}

  public async advance(input: Payload): Promise<RegistrationTransitionResultDto | null> {
    if (!input) return { state: null, isSuccessful: false, message: RegistrationTransitionMessage.WrongInput };
    const { userId } = input;

    // No userId means first registration step
    if (!userId) {
      const transition = this.stageTransitions.find((t) => t.state === RegistrationStatus.NotRegistered);
      if (!transition) {
        return {
          state: RegistrationStatus.NotRegistered,
          isSuccessful: false,
          message: RegistrationTransitionMessage.NoTransitionFound,
        };
      }

      const { state, nextState } = transition;
      if (!nextState) {
        return { state: nextState, isSuccessful: false, message: RegistrationTransitionMessage.NoNextState };
      }
      return this.next(state, nextState, null, input);
    } else {
      const registration = await this.data.userRegistrations.getByUserId(userId);
      if (!registration || !registration.status) {
        return { state: null, isSuccessful: false, message: RegistrationTransitionMessage.NoRegistrationStatusFound };
      }

      const transition = this.stageTransitions.find((t) => t.state === registration.status);
      if (!transition) {
        return {
          state: registration.status,
          isSuccessful: false,
          message: RegistrationTransitionMessage.NoTransitionFound,
        };
      }
      return this.next(transition.state, transition.nextState, userId, input);
    }
  }

  protected async next(
    state: RegistrationStatus | null,
    nextState: RegistrationStatus | null,
    id: string | null,
    input: Payload | null
  ): Promise<RegistrationTransitionResultDto> {
    const transition = this.stageTransitions.find((t) => t.nextState === nextState && t.state === state);
    if (!transition) {
      return { state, isSuccessful: false, message: RegistrationTransitionMessage.NoTransitionFound };
    }
    const { successEvent, failureEvent } = transition;
    const result = await transition.action(id, input);
    const { isSuccessful } = result;
    if (id) {
      const user = await this.data.users.getUserById(id);
      this.sendEvent(user, isSuccessful ? successEvent : failureEvent);
    }

    return result;
  }

  protected sendEvent(user: IApplicationUser | null, event: VerificationEvent | null): void {
    if (!event || !user) return;
    const eventInstance = VerificationEventFactory.create(user, event);
    if (!eventInstance) return;
    this.eventBus.publish(eventInstance);
  }
}
