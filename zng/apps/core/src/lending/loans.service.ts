import { LoanCreateRequestDto, LoanResponseDto } from '@core/dto';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { LoanInviteeTypeCodes, LoanStateCodes, LoanTypeCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';
import { ConfigService } from '@nestjs/config';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { ActionNotAllowedException, UnableToCreatePersonalBillerException } from '@core/domain/exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';
import { IBiller, ILoan, ILoanInvitee, IPaymentAccount } from '@library/entity/interface';
import { LendingLogic } from './lending.logic';
import { LoanAssignToContactInput } from '@library/shared/types/lending';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventBus: EventBus,
    private readonly config: ConfigService,) {}
    
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

    // Link user to lender/borrower
    if (inviteeType === LoanInviteeTypeCodes.Borrower) {
      loanCreateInput.lenderId = userId;
    } else if (inviteeType === LoanInviteeTypeCodes.Lender) {
      loanCreateInput.borrowerId = userId;
    }

    const result = await this.domainServices.loanServices.createLoan(loanCreateInput);
    return result as unknown as LoanResponseDto | null;
  }

  @MapToDto(LoanResponseDto)
  public async proposeLoan(userId: string, loanId: string,  sourcePaymentAccountId: string): Promise<LoanResponseDto | null> {

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
