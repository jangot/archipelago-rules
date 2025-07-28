import { BillerResponseDto } from '@core/modules/lending/dto/response';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(
  ) { }

  public async getBillers(billerName: string, postalCode: string, limit: number): Promise<BillerResponseDto[]> {
    this.logger.debug(`getBillers: Fetching billers with name: ${billerName} and postalCode: ${postalCode} for a maximum of ${limit} results`);

    const term = billerName?.trim().toLowerCase() ?? '';
    const zip = postalCode?.trim() ?? '';
    const max = Math.max(limit ?? 0, 0);

    const results = BILLERS.filter((b) =>
      b.billerPostalCode === zip &&
      b.billerName.toLowerCase().includes(term)
    );

    return max > 0 ? results.slice(0, max) : results;
  }
}

export const BILLERS: ReadonlyArray<BillerResponseDto> = [
  { billerId: '1-att',      billerName: 'AT&T',             billerPostalCode: '75034', billerClass: 'Phone' },
  { billerId: '1-ab1',      billerName: 'ABiz1',            billerPostalCode: '75034', billerClass: 'Retail' },
  { billerId: '1-ab2',      billerName: 'ABiz2',            billerPostalCode: '75034', billerClass: 'Retail' },
  { billerId: '1-ab3',      billerName: 'ABiz3',            billerPostalCode: '75034', billerClass: 'Airline' },
  { billerId: '1-abz1',     billerName: 'ABz1',             billerPostalCode: '75034', billerClass: 'Retail' },
  { billerId: '1-abz2',     billerName: 'ABz2',             billerPostalCode: '75034', billerClass: 'Retail' },
  { billerId: '2-spectrum', billerName: 'Spectrum',         billerPostalCode: '75098', billerClass: 'Cable' },
  { billerId: '2-sa1',      billerName: 'Sa1',              billerPostalCode: '75098', billerClass: 'Mortgage' },
  { billerId: '2-sa2',      billerName: 'Sa2',              billerPostalCode: '75098', billerClass: 'Airline' },
  { billerId: '2-sb1',      billerName: 'Sb1',              billerPostalCode: '75098', billerClass: 'Mortgage' },
  { billerId: '2-sb2',      billerName: 'Sb2',              billerPostalCode: '75098', billerClass: 'Mortgage' },
  { billerId: '2-sb3',      billerName: 'Sb3',              billerPostalCode: '75098', billerClass: 'Mortgage' },
  { billerId: '3-comcast',  billerName: 'Comcast Xfinity',  billerPostalCode: '75080', billerClass: 'Cable' },
  { billerId: '3-ca1',      billerName: 'Ca1',              billerPostalCode: '75080', billerClass: 'Insurance' },
  { billerId: '3-ca2',      billerName: 'Ca2',              billerPostalCode: '75080', billerClass: 'Insurance' },
  { billerId: '3-cd1',      billerName: 'Cd1',              billerPostalCode: '75080', billerClass: 'Airline' },
  { billerId: '3-cd2',      billerName: 'Cd2',              billerPostalCode: '75080', billerClass: 'Insurance' },
  { billerId: '3-cd3',      billerName: 'Cd3',              billerPostalCode: '75080', billerClass: 'Insurance' },
];
