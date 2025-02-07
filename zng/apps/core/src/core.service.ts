import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from './data/idata.service';
import { v4 } from 'uuid';
import { runOnTransactionCommit, runOnTransactionComplete, runOnTransactionRollback, Transactional } from 'typeorm-transactional';
import { withTransactionHandler } from '@library/shared/common/data/withtransaction.handler';

@Injectable()
export class CoreService {
  constructor(
    private readonly dataService: IDataService,
    private readonly logger: Logger) { }

  // Obviously this should be in a UserService class, not this class.
  public async getUserById(id: string) {
    return await this.dataService.users.get(id);
  }

  public async getUserByEmail(email: string) {
    return await this.dataService.users.getByEmail(email);
  }

  // For TypeORM Transactional testing purposes
  // On first call it will create a lender, borrower and a loan. Plus logs on transaction commit and complete
  // On second call it is expected to rollback the transaction and log on transaction rollback but 500 with QueryFailedError instead 
  @Transactional()
  public async transactionalTest(): Promise<void> {
    try {
      // Wrapper allows us to use more traditional await semantics
      // It also allows us to simply handle the catch clause to know whether or not the Transaction was Rolled back
      await withTransactionHandler(async () => {
        const lender = await this.dataService.users.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test-lender@mail.com',
          id: v4(),
          phoneNumber: '123'
        });

        const borrower = await this.dataService.users.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test-borrower@mail.com',
          id: v4(),
          phoneNumber: '123'
        });

        const loan = await this.dataService.loans.create({
          id: v4(),
          amount: 1000,
          borrowerId: '1',
          lenderId: '2',
          lender: lender,
          borrower: borrower
        });
      })
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
