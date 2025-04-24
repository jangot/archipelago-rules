import { CoreDataService } from '@core/data/data.service';
import { BillerTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { IBiller, ILoan } from '@library/entity/interface';
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

  public async createLoan(loan: DeepPartial<ILoan>): Promise<ILoan | null> {
    return this.data.loans.create({ ...loan, state: LoanStateCodes.Created });
  }

  public async createPersonalBiller(loan: DeepPartial<ILoan>): Promise<IBiller | null> {
    const { targetUserFirstName: firstName, targetUserLastName: lastName, isLendLoan } = loan;
    const loanType = isLendLoan ? 'offer' : 'request';
    const billerName = `Personal ${loanType} to ${firstName} ${lastName}`;
    return this.data.billers.create({ name: billerName, type: BillerTypeCodes.Personal });
  }
  
}
