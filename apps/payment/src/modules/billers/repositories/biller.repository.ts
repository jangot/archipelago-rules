import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * BillerRepository handles DB operations for BillerPayment entities.
 */
@Injectable()
export class BillerRepository extends RepositoryBase<Biller> {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(
    @InjectRepository(Biller)
    protected readonly repository: Repository<Biller>
  ) {
    super(repository, Biller);
  }

  /**
   * Fetches billers with pagination for memory-efficient processing of large datasets.
   * 
   * @param offset The number of records to skip
   * @param limit The maximum number of records to return
   * @returns Array of Biller entities with externalBillerId and crc32
   */
  public async getBillersWithPagination(offset: number, limit: number): Promise<Biller[]> {
    return this.repository
      .createQueryBuilder('biller')
      .select(['biller.id', 'biller.externalBillerId', 'biller.crc32'])
      .orderBy('biller.id', 'ASC')
      .offset(offset)
      .limit(limit)
      .getMany();
  }
} 
