import { Injectable, Logger } from '@nestjs/common';

/**
 * Service responsible for executing and monitoring transfers for loan payment steps
 */
@Injectable()
export class TransferExecutionService {
  private readonly logger: Logger = new Logger(TransferExecutionService.name);

  constructor() {}

}
