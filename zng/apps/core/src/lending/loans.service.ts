import { LoanCreateRequestDto, LoanResponseDto } from '@core/dto';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { LoanBindIntentCodes, LoanInviteeTypeCodes, LoanStateCodes, LoanTypeCodes, RegistrationStatus } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';
import { ConfigService } from '@nestjs/config';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { ActionNotAllowedException, UnableToCreatePersonalBillerException } from '@core/domain/exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';
import { IBiller, ILoan, ILoanInvitee, IPaymentAccount } from '@library/entity/interface';
import { LendingLogic } from './lending.logic';
import { LoanBindToContactInput } from '@library/shared/types/lending';

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

    const loan = await this.loadLoan(loanId);
    LendingLogic.validateLoanProposeInput(userId, loan);

    const { invitee } = loan;
    const isInviteeBorrower = invitee.type === LoanInviteeTypeCodes.Borrower;
    
    const paymentAccount = await this.loadPaymentAccount(sourcePaymentAccountId, userId);
    
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

    const result = await this.loadLoan(loanId);
    return result as unknown as LoanResponseDto | null;
  }

  // WIP
  public async setLoansTarget(input: LoanBindToContactInput): Promise<void> {
    const { contactValue, contactType, intent, loanId } = input;
    // Before looking for Loans we should check that User with provided contact is registered  

    const user = await this.domainServices.userServices.getUserByContact(contactValue, contactType);
    
    if (!user || user.registrationStatus !== RegistrationStatus.Registered) {
      switch (intent) {
        // If intent is `propose` - it is okay if no such User yet (means that binding will happen when User registered)
        case LoanBindIntentCodes.Propose:
          this.logger.log(`Attempted to bind Loan ${loanId} to ${contactType} ${contactValue} during proposal but User not registered yet`);
          break;
        case LoanBindIntentCodes.Registration:
          this.logger.error(`Attempted to bind Loan ${loanId} to ${contactType} ${contactValue} after registration but could not find User or registration not completed yet`);
          break;
      }
      return;
    }
    await this.domainServices.loanServices.setLoansTarget({ ...input, userId: user.id });
  }

  private async createPersonalBiller(invitee: DeepPartial<ILoanInvitee>, createdById: string): Promise<IBiller> {
    const personalBiller = await this.domainServices.loanServices.createPersonalBiller(invitee, createdById);
    if (!personalBiller) {
      this.logger.error('LoanCreateCommand: Failed to create personal Biller', { invitee, createdById });
      throw new UnableToCreatePersonalBillerException('Failed to create personal biller');
    }
    return personalBiller;
  }

  private async loadLoan(loanId: string | null): Promise<ILoan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.domainServices.loanServices.getLoanById(loanId);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  private async loadPaymentAccount(accountId: string, ownerId?: string): Promise<IPaymentAccount> {
    const paymentAccount = await this.domainServices.paymentServices.getPaymentAccountById(accountId);
    if (!paymentAccount) {
      throw new EntityNotFoundException('Payment account not found');
    }
    if (ownerId && paymentAccount.userId !== ownerId) {
      throw new ActionNotAllowedException('Payment account does not belong to the user');
    }

    return paymentAccount;
  }
}
