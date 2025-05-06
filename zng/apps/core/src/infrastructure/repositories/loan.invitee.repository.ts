import { LoanInvitee } from '@core/domain/entities';
import { ILoanInviteeRepository } from '@core/shared/interfaces/repositories';
import { ContactType } from '@library/entity/enum';
import { ILoanInvitee } from '@library/entity/interface';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LoanInviteeRepository extends RepositoryBase<LoanInvitee> implements ILoanInviteeRepository {
  private readonly logger: Logger = new Logger(LoanInviteeRepository.name);

  constructor(@InjectRepository(LoanInvitee) protected readonly repository: Repository<LoanInvitee>) {
    super(repository, LoanInvitee);
  }

  public async getLoanInvitee(loanId: string, contactValue: string, contactType: ContactType): Promise<ILoanInvitee | null> {
    switch (contactType) {      
      case ContactType.EMAIL:
        return this.repository.findOne({ where: { loanId, email: contactValue } });
      case ContactType.PHONE_NUMBER:
        return this.repository.findOne({ where: { loanId, phone: contactValue } });
      default:
        return null;
    }
  }
} 
