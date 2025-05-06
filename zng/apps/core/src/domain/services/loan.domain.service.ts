import { CoreDataService } from '@core/data/data.service';
import { BillerTypeCodes, LoanInviteeTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { IBiller, ILoan, ILoanInvitee } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DeepPartial } from 'typeorm';

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

  public async getLoansForBinding(contactUri: string): Promise<Array<ILoan>> {
    return this.data.loans.getLoansForBinding(contactUri);
  }

  public async bindLoansToUser(userId: string, loanId?: string, contactUri?: string): Promise<Array<ILoan>> {
    return this.data.loans.bindLoansToUser(userId, loanId, contactUri);
  }
  
}
