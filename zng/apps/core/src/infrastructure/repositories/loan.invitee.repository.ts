import { LoanInvitee } from '@core/domain/entities';
import { ILoanInviteeRepository } from '@core/shared/interfaces/repositories';
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
} 
