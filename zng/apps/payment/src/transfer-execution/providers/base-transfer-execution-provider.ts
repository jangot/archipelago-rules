import { Injectable, Logger } from '@nestjs/common';
import { ITransferExecutionProvider } from '../interface';
import { PaymentDomainService } from '@payment/domain/services';

@Injectable()
export abstract class BaseTransferExecutionProvider implements ITransferExecutionProvider {
  protected readonly logger: Logger;
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    this.logger = new Logger(this.constructor.name);
  }
  
  public abstract executeTransfer(transferId: string): Promise<boolean | null>;
}
