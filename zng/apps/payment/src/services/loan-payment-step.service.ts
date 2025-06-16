import { PaymentStepState } from '@library/entity/enum';
import { Injectable, Logger } from '@nestjs/common';
import { ManagementDomainService } from '@payment/domain/services';

@Injectable()
export class LoanPaymentStepService {
  private readonly logger = new Logger(LoanPaymentStepService.name);

  constructor(private readonly managementDomainService: ManagementDomainService) {}

  /**
   * Advances a payment step to its next state in the payment flow.
   * This method handles the progression of payment steps according to the defined workflow.
   * It updates the step's state in the database and triggers any necessary side effects.
   * 
   * @param stepId - The unique identifier of the step to advance
   * @param stepState - Optional current state of the step to validate before advancing
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., step not found, invalid state transition)
   */
  public async advanceStep(stepId: string): Promise<boolean | null>;
  public async advanceStep(stepId: string, stepState: PaymentStepState): Promise<boolean | null>;
  public async advanceStep(stepId: string, stepState?: PaymentStepState): Promise<boolean | null> {
    this.logger.debug(`Advancing step ${stepId} ${stepState ? `with state ${stepState}` : ''}`);
    return this.managementDomainService.advancePaymentStep(stepId, stepState);
  }
}
