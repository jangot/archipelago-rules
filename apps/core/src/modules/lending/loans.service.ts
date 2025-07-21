import { LoanState, LoanStateCodes, LoanTypeCodes } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EventManager } from '@library/shared/common/event/event-manager';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { Biller, Loan, PaymentAccount } from '@library/shared/domain/entity';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDomainServices } from '../domain/idomain.services';
import { LoanCreateRequestDto } from './dto/request/loan.create.request.dto';
import { LoanResponseDto } from './dto/response/loan.response.dto';
import { ActionNotAllowedException, UnableToCreatePersonalBillerException } from './exceptions/loan-domain.exceptions';
import { ILoanStateManagersFactory } from './interfaces';
import { LendingLogic } from './lending.logic';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventManager: EventManager,
    private readonly config: ConfigService,
    @Inject(ILoanStateManagersFactory)
    private readonly stateManagerFactory: ILoanStateManagersFactory) {}
    
  public async createLoan(userId: string, input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    LendingLogic.validateLoanCreateInput(input);

    const loanCreateInput: Partial<Loan> = EntityMapper.toEntity(input, Loan);
    const { type } = input;
    
    if (type === LoanTypeCodes.Personal && !loanCreateInput.billerId) {
      const personalBiller = await this.createPersonalBiller(userId);
      loanCreateInput.billerId = personalBiller.id;
    }

    // Link user who created a Loan to lender/borrower side
    loanCreateInput.lenderId = userId; // Will come from the loan application, refactor still pending

    const result = await this.domainServices.loanServices.createLoan(loanCreateInput);
    return DtoMapper.toDto(result, LoanResponseDto);
  }

  public async proposeLoan(userId: string, loanId: string, sourcePaymentAccountId: string): Promise<LoanResponseDto | null> {

    const loan = await this.getLoan(loanId);
    LendingLogic.validateLoanProposeInput(userId, loan);

    const paymentAccount = await this.getPaymentAccount(sourcePaymentAccountId, userId);
    
    const updates: Partial<Loan> = {};
    updates.lenderAccountId = paymentAccount.id; // Will come from the loan application, refactor still pending
    updates.state = LoanStateCodes.Offered;
    
    const updateResult = await this.domainServices.loanServices.updateLoan(loan.id, updates);
    if (!updateResult) {
      throw new EntityFailedToUpdateException('Failed to update loan');
    }

    const result = await this.getLoan(loanId);
    return DtoMapper.toDto(result, LoanResponseDto);
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

  private async createPersonalBiller(createdById: string): Promise<Biller> {
    const personalBiller = await this.domainServices.loanServices.createPersonalBiller(createdById);
    if (!personalBiller) {
      this.logger.error('LoanCreateCommand: Failed to create personal Biller', { createdById });
      throw new UnableToCreatePersonalBillerException('Failed to create personal biller');
    }
    return personalBiller;
  }

  private async getLoan(loanId: string | null): Promise<Loan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.domainServices.loanServices.getLoanById(loanId, [LOAN_RELATIONS.Invitee]);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  private async getPaymentAccount(accountId: string, ownerId?: string): Promise<PaymentAccount> {
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
