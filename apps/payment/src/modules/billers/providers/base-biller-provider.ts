import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export abstract class BaseBillerProvider {
  protected readonly logger: Logger = new Logger(BaseBillerProvider.name);
  protected readonly localBucketPath: string = path.resolve(__dirname, '../local-bucket');
  constructor() {}

 
}
