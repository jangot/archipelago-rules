import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { BillerPayment } from '@library/shared/domain/entity/biller.payment.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillerRepository } from '../../../shared/interfaces/repositories/ibiller.payment.repository';

/**
 * BillerRepository handles DB operations for BillerPayment entities.
 */
@Injectable()
export class BillerRepository extends RepositoryBase<BillerPayment> implements IBillerRepository {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(
    @InjectRepository(BillerPayment)
    repository: Repository<BillerPayment>,
  ) {
    super(repository, BillerPayment);
  }
  // Add custom methods if needed
} 
