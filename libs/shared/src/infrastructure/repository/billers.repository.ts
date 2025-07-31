import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Biller } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * BillersRepository handles DB operations for BillerPayment entities.
 */
@Injectable()
export class BillersRepository extends RepositoryBase<Biller> {
  private readonly logger: Logger = new Logger(BillersRepository.name);

  constructor(
    @InjectRepository(Biller)
    protected readonly repository: Repository<Biller>
  ) {
    super(repository, Biller);
  }
} 
