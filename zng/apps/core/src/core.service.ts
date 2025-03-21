import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from './data/idata.service';
import { v4 } from 'uuid';
import { Transactional } from 'typeorm-transactional';
import { random } from 'lodash';

@Injectable()
export class CoreService {
  private readonly logger: Logger = new Logger(CoreService.name);
  constructor(private readonly dataService: IDataService) {}

  // For TypeORM Transactional testing purposes
  // On first call it will create a lender, borrower and a loan. Plus logs on transaction commit and complete
  // On second call it is expected to rollback the transaction and log on transaction rollback but 500 with QueryFailedError instead
  // It turns out we don't need the Wrapper I created to handle Transactions cleanly
  // If an Exception is thrown here, then the Transaction has been Rolled back
  // If no Exception occurs then we can assume that the Transaction was commited
  // Of course, this assumes you don't put any try...catch block in around individual DB calls and handle it yourself (do NOT do that)
  @Transactional()
  public async transactionalTest(shouldFail: boolean): Promise<boolean> {
    const email1 = shouldFail ? 'test-lender@x.com' : `test-lender+${random(1000000, false)}@x.com`;
    const email2 = shouldFail ? 'test-borrower@y.com' : `test-borrower+${random(1000000, false)}@y.com`;
    const lenderId = v4();
    const borrowerId = v4();

    try {
      const lender = await this.dataService.users.insert(
        { firstName: 'John', lastName: 'Doe', email: email1, id: lenderId, phoneNumber: '123' },
        true
      );

      const borrower = await this.dataService.users.insert(
        { firstName: 'John', lastName: 'Doe', email: email2, id: borrowerId, phoneNumber: '123' },
        true
      );

      await this.dataService.loans.insert({
        id: v4(),
        amount: random(100, 1000, false),
        borrowerId: lenderId,
        lenderId: borrowerId,
        lender: lender!,
        borrower: borrower!,
      });

      // Do something after the transaction is committed
      this.logger.debug('Transaction committed - 1');
      return true;
    } catch (error) {
      this.logger.error(`${error.message} - 1`);
      return false;
    }
  }
}
