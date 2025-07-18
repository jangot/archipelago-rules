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
} 
