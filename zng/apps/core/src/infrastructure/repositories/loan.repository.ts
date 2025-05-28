import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ILoanRepository } from '../../shared/interfaces/repositories';
import { Loan } from '../../domain/entities';
import { ILoan } from '@library/entity/interface';
import { LoanAssignToContactInput } from '@library/shared/types/lending';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> implements ILoanRepository {
  private readonly logger: Logger = new Logger(LoanRepository.name);

  constructor(
    @InjectRepository(Loan)
    protected readonly repository: Repository<Loan>
  ) {
    super(repository, Loan);
  }


  public async getByLenderId(lenderId: string): Promise<ILoan[] | null> {
    this.logger.debug(`getByLenderId: ${lenderId}`);

    return this.repository.findBy({ lenderId });
  }

  // WIP
  public async setLoansTarget(input: LoanAssignToContactInput): Promise<ILoan[]> {
    const { contactValue, contactType, intent, loanId } = input;
    this.logger.debug(`setLoansTarget: intent:${intent}, contactValue:${contactValue}`, { input });

    if (!loanId && !contactValue && !contactType) {
      throw new MissingInputException('Either loanId or contact information must be provided.');
    }

    const updatedLoans: ILoan[] = [];

    if (loanId) {
      const loan = await this.repository.findOne({ where: { id: loanId } });
      if (!loan) {
        throw new EntityNotFoundException(`Loan with id ${loanId} not found.`);
      }    
    } else {
      
    }

    return updatedLoans;
  }
}
