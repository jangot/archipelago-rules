import { Injectable, Logger } from '@nestjs/common';
import { ITransferExecutionProvider } from '../interface';
import { IDomainServices } from '@payment/domain/idomain.services';

@Injectable()
export abstract class BaseTransferExecutionProvider implements ITransferExecutionProvider {
  protected readonly logger: Logger;
  constructor(protected readonly domainServices: IDomainServices) {
    this.logger = new Logger(this.constructor.name);
  }
  
  public abstract executeTransfer(transferId: string): Promise<boolean | null>;
}
