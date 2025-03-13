import { RegistrationStatus } from '@library/entity/enum';
import { RegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../dto';
import { IDataService } from '../../data/idata.service';
import { RegistrationStageTransition } from './stage-transition.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationEvent, VerificationEventFactory } from '../verification';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IApplicationUser } from '@library/entity/interface';
import { UserRegistration } from '../../data/entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RegistrationFlow {
  private stageTransitions: RegistrationStageTransition[];

  constructor(
    protected readonly transitions: RegistrationStageTransition[],
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService,
    protected readonly eventBus: EventBus,
    protected readonly commandBus: CommandBus
  ) {
    this.stageTransitions = transitions;
  }

  public async advance(
    input: RegistrationDto,
    startFrom?: RegistrationStatus
  ): Promise<RegistrationTransitionResultDto | null> {
    if (!input) return { state: null, isSuccessful: false, message: RegistrationTransitionMessage.WrongInput };
    const { userId, retry } = input;

    // No userId means first registration step
    if (!userId) {
      if (startFrom && startFrom !== RegistrationStatus.NotRegistered) {
        return { state: startFrom, isSuccessful: false, message: RegistrationTransitionMessage.WrongInput };
      }
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
      const registration = await this.getUserRegistration(userId);
      if (!registration || !registration.status) {
        return { state: null, isSuccessful: false, message: RegistrationTransitionMessage.NoRegistrationStatusFound };
      }

      const transition = retry
        ? this.stageTransitions.find((t) => t.state === t.nextState && t.state === registration.status)
        : this.stageTransitions.find((t) => t.state === registration.status);
      if (!transition || (startFrom && transition.state !== startFrom)) {
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
    input: RegistrationDto | null
  ): Promise<RegistrationTransitionResultDto> {
    const transition = this.stageTransitions.find((t) => t.nextState === nextState && t.state === state);
    if (!transition) {
      return { state, isSuccessful: false, message: RegistrationTransitionMessage.NoTransitionFound };
    }
    const { successEvent, failureEvent } = transition;
    //const result = await transition.action(id, input);
    const command = new transition.action({ id, input });
    const result = await this.commandBus.execute(command);

    const { isSuccessful } = result;
    if (id) {
      const user = await this.data.users.getUserById(id);
      this.sendEvent(user, isSuccessful ? successEvent : failureEvent);
    }

    return result;
  }

  protected async getUserRegistration(userId: string): Promise<UserRegistration | null> {
    return this.data.userRegistrations.getByUserId(userId);
  }

  protected sendEvent(user: IApplicationUser | null, event: VerificationEvent | null): void {
    if (!event || !user) return;
    const eventInstance = VerificationEventFactory.create(user, event);
    if (!eventInstance) return;
    this.eventBus.publish(eventInstance);
  }
}
