import { EventBus } from '@nestjs/cqrs';
import { IVerificationFlow } from './iverification-flow.base';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationEventFactory } from './verification-event.factory';
import { IApplicationUser } from '@library/entity/interface';
import { RegistrationStatus } from '@library/entity/enum/verification.state';

export class VerificationFlow implements IVerificationFlow {
  protected currentVerificationFlowState: VerificationFlowState;

  constructor(
    protected readonly verificationFlowStates: VerificationFlowState[],
    protected eventBus: EventBus
  ) {
    if (verificationFlowStates.length === 0) {
      throw new Error('Verification flow states must be provided');
    }

    this.currentVerificationFlowState = verificationFlowStates[0];
  }

  public next(): VerificationFlowState | null {
    if (this.isComplete() || this.currentVerificationFlowState.nextState === null) {
      return null;
    }

    const nextVerificationFlowState = this.verificationFlowStates.find(
      (state) => state.state === this.currentVerificationFlowState.nextState
    );

    if (!nextVerificationFlowState) {
      throw new Error('No next verification flow state found');
    }

    this.currentVerificationFlowState = nextVerificationFlowState;
    return nextVerificationFlowState;
  }

  public setCurrentState(currentState: RegistrationStatus): VerificationFlowState {
    const state = this.verificationFlowStates.find((state) => state.state === currentState);
    if (!state) {
      throw new Error('No verification flow state found');
    }

    this.currentVerificationFlowState = state;
    return state;
  }

  public isComplete(): boolean {
    return this.currentVerificationFlowState.isVerified;
  }

  public sendNotification(user: IApplicationUser): void {
    if (!this.currentVerificationFlowState.notificationName) {
      return;
    }

    const event = VerificationEventFactory.create(user, this.currentVerificationFlowState.notificationName);
    if (!event) {
      return;
    }

    this.eventBus.publish(event);
  }
}
