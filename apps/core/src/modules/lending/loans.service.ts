import { LoanCreateRequestDto } from './dto/request/loan.create.request.dto';
import { LoanResponseDto } from './dto/response/loan.response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { LoanInviteeTypeCodes, LoanState, LoanStateCodes, LoanTypeCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';
import { ConfigService } from '@nestjs/config';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { ActionNotAllowedException, UnableToCreatePersonalBillerException } from './exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';
import { IBiller, ILoan, ILoanInvitee, IPaymentAccount } from '@library/entity/entity-interface';
import { LendingLogic } from './lending.logic';
import { LoanAssignToContactInput } from '@library/shared/types/lending';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { ILoanStateManagersFactory } from './interfaces';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventBus: EventBus,
    private readonly config: ConfigService,
    private readonly stateManagerFactory: ILoanStateManagersFactory) {}
    
  @MapToDto(LoanResponseDto)
  public async createLoan(userId: string, input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    LendingLogic.validateLoanCreateInput(input);

    const loanCreateInput: DeepPartial<ILoan> = { ...input };
    const { type, invitee } = input;
    const { type: inviteeType } = invitee;

    if (type === LoanTypeCodes.Personal) {
      const personalBiller = await this.createPersonalBiller(invitee, userId);
      loanCreateInput.billerId = personalBiller.id;
    }

    // Link user who created a Loan to lender/borrower side
    if (inviteeType === LoanInviteeTypeCodes.Borrower) {
      loanCreateInput.lenderId = userId;
    } else if (inviteeType === LoanInviteeTypeCodes.Lender) {
      loanCreateInput.borrowerId = userId;
    }

    const result = await this.domainServices.loanServices.createLoan(loanCreateInput);
    return result as unknown as LoanResponseDto | null;
  }

  @MapToDto(LoanResponseDto)
  public async proposeLoan(userId: string, loanId: string, sourcePaymentAccountId: string): Promise<LoanResponseDto | null> {

    const loan = await this.getLoan(loanId);
    LendingLogic.validateLoanProposeInput(userId, loan);

    const { invitee } = loan;
    const isInviteeBorrower = invitee.type === LoanInviteeTypeCodes.Borrower;
    
    const paymentAccount = await this.getPaymentAccount(sourcePaymentAccountId, userId);
    
    const updates: DeepPartial<ILoan> = {};
    if (isInviteeBorrower) {
      updates.lenderAccountId = paymentAccount.id;
      updates.state = LoanStateCodes.Offered;
    } else {
      updates.borrowerAccountId = paymentAccount.id;
      updates.state = LoanStateCodes.Requested;
    }
    
    const updateResult = await this.domainServices.loanServices.updateLoan(loan.id, updates);
    if (!updateResult) {
      throw new EntityFailedToUpdateException('Failed to update loan');
    }

    const result = await this.getLoan(loanId);
    return result as unknown as LoanResponseDto | null;
  }

  public async setLoansTarget(input: LoanAssignToContactInput): Promise<void> {
    await this.domainServices.loanServices.setLoansTarget(input);
  }

  @MapToDto(LoanResponseDto)
  public async acceptLoan(loanId: string, userId: string, targetPaymentAccountId: string): Promise<LoanResponseDto | null> {
    if (!loanId || !userId || !targetPaymentAccountId) {
      this.logger.warn('Missing required parameters for accepting loan', { loanId, userId, targetPaymentAccountId });
      throw new MissingInputException('Some of the required parameters (Loan ID, User ID, Payment Account ID) are missing');
    }
    const result = await this.domainServices.loanServices.acceptLoan(loanId, userId, targetPaymentAccountId);
    return result as unknown as LoanResponseDto | null;
  }

  /**
   * Advances a loan through its state machine lifecycle by delegating to the appropriate state manager.
   * 
   * This method uses the State Pattern to handle loan state transitions. It retrieves the correct
   * state manager instance from the factory based on the loan ID and optional current state,
   * then delegates the advancement logic to that manager. Each state manager is responsible for
   * validating if a transition is possible and executing the appropriate business logic.
   * 
   * The method supports the following state transitions:
   *  - `accepted` -> `funding`
   *  - `funding` -> `funded`
   *  - `funded` -> `disbursing`
   *  - `disbursing` -> `disbursed`
   *  - `disbursed` -> `repaying`
   *  - `repaying` -> `repaid`
   *  - `repaid` -> `closed`
   *  - Plus all related error/paused states (e.g., `funding_paused`, `disbursing_paused`)
   * 
   * @param loanId - The unique identifier of the loan to advance
   * @param currentState - Optional current state to optimize manager selection. If not provided,
   *                      the factory will retrieve the current state from the database
   * @returns Promise<boolean | null> - true if the loan was successfully advanced to the next state,
   *                                   false if no advancement was possible/needed, null if an error occurred
   */
  public async advanceLoan(loanId: string): Promise<boolean | null>;
  public async advanceLoan(loanId: string, currentState: LoanState): Promise<boolean | null>;
  public async advanceLoan(loanId: string, currentState?: LoanState): Promise<boolean | null> {
    const manager = await this.stateManagerFactory.getManager(loanId, currentState);
    return manager.advance(loanId);
  }

  private async createPersonalBiller(invitee: DeepPartial<ILoanInvitee>, createdById: string): Promise<IBiller> {
    const personalBiller = await this.domainServices.loanServices.createPersonalBiller(invitee, createdById);
    if (!personalBiller) {
      this.logger.error('LoanCreateCommand: Failed to create personal Biller', { invitee, createdById });
      throw new UnableToCreatePersonalBillerException('Failed to create personal biller');
    }
    return personalBiller;
  }

  private async getLoan(loanId: string | null): Promise<ILoan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.domainServices.loanServices.getLoanById(loanId, [LOAN_RELATIONS.Invitee]);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  private async getPaymentAccount(accountId: string, ownerId?: string): Promise<IPaymentAccount> {
    const paymentAccount = await this.domainServices.userServices.getPaymentAccountById(accountId);
    if (!paymentAccount) {
      throw new EntityNotFoundException('Payment account not found');
    }
    if (ownerId && paymentAccount.userId !== ownerId) {
      throw new ActionNotAllowedException('Payment account does not belong to the user');
    }

    return paymentAccount;
  }
}
