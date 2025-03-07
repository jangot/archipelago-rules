import { EventBus } from '@nestjs/cqrs';
import { VerificationFlow } from './verification-flow.base';
import { standardVerificationFlow } from './verification.flows';

export class VerificationFlowFactory {
  public static create(eventBus: EventBus): VerificationFlow {
    return new VerificationFlow(standardVerificationFlow, eventBus);
  }
}
