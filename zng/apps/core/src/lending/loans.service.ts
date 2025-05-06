import { LoanCreateRequestDto, LoanResponseDto } from '@core/dto';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { LoanBindIntent, LoanBindIntentCodes, LoanInviteeTypeCodes, LoanStateCodes, LoanTypeCodes, RegistrationStatus } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';
import { ConfigService } from '@nestjs/config';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { ActionNotAllowedException, BillerNotSelectedException, UnableToCreatePersonalBillerException } from '@core/domain/exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';
import { IBiller, ILoan, ILoanInvitee } from '@library/entity/interface';
import { parseContactUri } from '@library/shared/common/helpers';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventBus: EventBus,
    private readonly config: ConfigService) {}
    
  @MapToDto(LoanResponseDto)
  public async createLoan(userId: string, input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    const loanCreateInput: DeepPartial<ILoan> = { ...input };
    const { billerId, type, invitee } = input;

    // Check Loan Invitee data provided
    if (!invitee || !invitee.type || !invitee.email || !invitee.phone) {
      throw new MissingInputException('Loan Invitee details missing');
    }
    const { type: inviteeType } = invitee;

    // Check Biller - create personal if P2P, otherwise if empty - throw

    if (type !== LoanTypeCodes.Personal && !billerId) {
      this.logger.warn(`LoanCreateCommand: No billerId provided for loan type: ${type}`);
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }

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
    const { lenderId, borrowerId, invitee } = loan;
    const isInviteeBorrower = invitee.type === LoanInviteeTypeCodes.Borrower;
    const canBeProposedBy = isInviteeBorrower ? lenderId : borrowerId;
    
    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException(`Only ${isInviteeBorrower ? 'lender' : 'borrower'} can propose the loan ${isInviteeBorrower ? 'offer' : 'request'}`);
    }
    
    const paymentAccount = await this.domainServices.paymentServices.getPaymentAccountById(sourcePaymentAccountId);
    if (!paymentAccount) {
      throw new EntityNotFoundException('Payment account not found');
    }
    if (paymentAccount.ownerId !== userId) {
      throw new ActionNotAllowedException('Payment account does not belong to the user');
    }
    
    // TODO: Add Payment Account state validation (e.g. not verified yet)
    
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
  public async bindLoansToContact(contactUri: string, intent: LoanBindIntent, loanId?: string): Promise<Array<LoanResponseDto> | null> {
    const loans: ILoan[] = [];
    
    // Before looking for Loans we should check that User with provided contact is registered  
    // TODO: No URI ANYMORE!!!
    const parsedContact = parseContactUri(contactUri);
    if (!parsedContact) {
      throw new MissingInputException('Wrong target contact uri');
    }
    
    const { type: contactType, value: contactValue } = parsedContact;
    const user = await this.domainServices.userServices.getUserByContact(contactValue, contactType);
    
    if (!user || user.registrationStatus !== RegistrationStatus.Registered) {
      switch (intent) {
        // If intent is `propose` - it is okay if no such User yet (means that binding will happen when User registered)
        case LoanBindIntentCodes.Propose:
          this.logger.log(`Attempted to bind Loan ${loanId} to contact ${contactUri} during proposal but User not registered yet`);
          break;
        case LoanBindIntentCodes.Registration:
          this.logger.error(`Attempted to bind Loan ${loanId} to contact ${contactUri} after registration but could not find User or registration not completed yet`);
          break;
      }
      return null;
    }
    
    // If `loanId` provided - it means that Binding should be performed only on that loan
    // otherwise - we'll search for all loans targeting provided contactUri
    
    //return this.domainServices.loanServices.bindLoansToUser(user.id, loanId || undefined, contactUri);
    return null;
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
}
