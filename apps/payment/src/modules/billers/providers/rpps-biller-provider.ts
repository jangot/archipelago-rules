import { Injectable } from '@nestjs/common';
import { BaseBillerProvider } from './base-biller-provider';

@Injectable()
export class RppsBillerProvider extends BaseBillerProvider { 
  constructor(
    // private readonly s3Service: S3Service,
    // private readonly parser: RPPSParser,
  ) {
    super();
  }

}
