import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { IBillerProvider } from '../interfaces/billers-provider.interface';

@Injectable()
export abstract class BaseBillerProvider implements IBillerProvider {
  protected readonly logger: Logger = new Logger(BaseBillerProvider.name);
  constructor(
    // private readonly s3Service: S3Service,
    // private readonly parser: RPPSParser,
  ) {}

  public acquire(billerNetworkType: BillerNetworkType, filePath: string): void {

    //   // const file = await this.s3Service.getFile(filePath);
    //   const biller = await this.parser.parse(file);

    //   return null;
    // }}
  }
}
