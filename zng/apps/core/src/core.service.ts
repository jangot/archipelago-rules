import { Injectable } from '@nestjs/common';
import { IDataService } from './data/idata.service';
import { v4 } from 'uuid';
import { runOnTransactionCommit, runOnTransactionComplete, runOnTransactionRollback, Transactional } from 'typeorm-transactional';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CoreService {
  constructor(private readonly dataService: IDataService, private readonly logger: Logger) {}
  getHello(): string {
    return 'Hello World!';
  }

  // For TypeORM Transactional testing purposes
  // On first call it will create a lender, borrower and a loan. Plus logs on transaction commit and complete
  // On second call it is expected to rollback the transaction and log on transaction rollback but 500 with QueryFailedError instead 
  @Transactional()
  async transactionalTest() {
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

    runOnTransactionCommit(() => {
      this.logger.debug('Transaction committed', {lender, borrower, loan});
    });

    runOnTransactionComplete((cb) => {
      this.logger.debug('Transaction completed', {lender, borrower, loan, cb});
    });

    runOnTransactionRollback((cb) => {
      this.logger.debug('Transaction rolled back', {lender, borrower, loan, cb});
    })
  }
}
