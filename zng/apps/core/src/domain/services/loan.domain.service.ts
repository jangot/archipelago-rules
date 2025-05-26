import { CoreDataService } from '@core/data/data.service';
import { BillerTypeCodes, LoanInviteeType, LoanInviteeTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { IBiller, ILoan, ILoanInvitee } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { LoanBindToUserInput } from '@library/shared/types/lending';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DeepPartial } from 'typeorm';
import { ActionNotSupportedForStateException } from '../exceptions/loan-domain.exceptions';

@Injectable()
export class LoanDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(LoanDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  public async getLoanById(loanId: string): Promise<ILoan | null> {
    return this.data.loans.findOne({ where: { id: loanId }, relations: ['invitee'] });
  }

  public async createLoan(loan: DeepPartial<ILoan>): Promise<ILoan | null> {
    const createdLoan = await this.data.loans.create({ ...loan, state: LoanStateCodes.Created });
    const { id: loanId } = createdLoan;
    const invitee = loan.invitee!;
    invitee.loanId = loanId;
    await this.data.loanInvitees.create(invitee);
    return this.getLoanById(loanId);
  }

  public async createPersonalBiller(invitee: DeepPartial<ILoanInvitee>, createdById: string): Promise<IBiller | null> {
    const loanTypeText = invitee ? invitee.type === LoanInviteeTypeCodes.Borrower ? 'offer' : 'request' : '';
    const billerName = `Personal ${loanTypeText} to ${invitee?.firstName} ${invitee?.lastName}`;
    return this.data.billers.create({ name: billerName, type: BillerTypeCodes.Personal, createdById });
  }

  public async getOrCreateCustomBiller(createdById: string, billerName: string): Promise<IBiller | null> {
    // To reduce the duplicates chance we try to find same Biller first
    const existingBiller = await this.data.billers.findOne({ where: { name: billerName, createdById, type: BillerTypeCodes.Custom } });
    if (existingBiller) return existingBiller;
    return this.data.billers.create({ name: billerName, type: BillerTypeCodes.Custom, createdById });
  }

  public async getCustomBillers(createdById: string): Promise<Array<IBiller> | null> {
    return this.data.billers.getAllCustomBillers(createdById);
  }

  public async updateLoan(loanId: string, loan: DeepPartial<ILoan>): Promise<boolean | null> {
    return this.data.loans.update(loanId, loan);
  }

  /**
     * Links lender or borrower to `proposed` Loan
     * @param loanId Loan to be updated
     * @param targetId Loan's target User Id
     * @param targetType Type of the target User - `borrower` or `lender`
     */
  public async setLoanTarget(loanId: string, targetId: string, targetType: LoanInviteeType): Promise<ILoan | null> {
    const loan = await this.getLoanById(loanId);
    if (!loan) {
      throw new EntityNotFoundException(`Loan with id ${loanId} not found.`);
    }
    const { state, lenderId, borrowerId } = loan;
    if (state !== LoanStateCodes.Offered && state !== LoanStateCodes.Requested) {
      throw new ActionNotSupportedForStateException(`Loan should be in ${LoanStateCodes.Offered} or ${LoanStateCodes.Requested} state to set the target`);
    }
    if (lenderId && borrowerId) {
      throw new ActionNotSupportedForStateException('Loan already has lender and borrower assigned');
    }
    if (lenderId && targetType === LoanInviteeTypeCodes.Lender || borrowerId && targetType === LoanInviteeTypeCodes.Borrower) {
      throw new ActionNotSupportedForStateException(`Loan has ${targetType} already assigned`);
    }
    const newState = state === LoanStateCodes.Offered ? LoanStateCodes.BorrowerAssigned : LoanStateCodes.LenderAssigned;
    loan.state = newState;
    loan.borrowerId = newState === LoanStateCodes.BorrowerAssigned ? targetId : borrowerId;
    loan.lenderId = newState === LoanStateCodes.LenderAssigned ? targetId : lenderId;
  
    const updateResult = await this.updateLoan(loanId, loan);
    if (!updateResult) {
      throw new EntityFailedToUpdateException('Failed to update loan');
    }
    return this.getLoanById(loanId);
  }

  public async setLoansTarget(input: LoanBindToUserInput): Promise<Array<ILoan>> {
    const updatedLoans: ILoan[] = [];
    const { contactValue, contactType, loanId, userId } = input;
    let targetUserId = userId;

    if (!loanId && !contactValue && !contactType) {
      throw new MissingInputException('Either loanId or contact information must be provided.');
    }


    if (loanId) {
      const invitee = await this.data.loanInvitees.getLoanInvitee(loanId, contactValue, contactType);      
      if (!invitee) {
        throw new EntityNotFoundException('Loan does not have an invitee');
      }
      if (!targetUserId) {
        const user = await this.data.users.getUserByContact(contactValue, contactType);
        if (!user) {
          throw new EntityNotFoundException('User not found');
        }
        targetUserId = user.id;
      }
      const result = await this.setLoanTarget(loanId, targetUserId, invitee.type);
      if (result) {
        updatedLoans.push(result);
      }
    } else {
      // TODO: temporal
      throw new NotImplementedException();
      //this.data.loans.setLoansTarget(input);
    }
    return updatedLoans;
  }
  
}
