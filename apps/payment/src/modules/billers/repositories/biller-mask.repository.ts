import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { BillerMask } from '@library/shared/domain/entity/biller.mask.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillerMaskRepository } from '../../../shared/interfaces/repositories/ibiller.mask.repository';

/**
 * BillerMaskRepository handles DB operations for BillerMask entities.
 */
@Injectable()
export class BillerMaskRepository extends RepositoryBase<BillerMask> implements IBillerMaskRepository {
  private readonly logger: Logger = new Logger(BillerMaskRepository.name);

  constructor(
    @InjectRepository(BillerMask)
    protected readonly repository: Repository<BillerMask>,
  ) {
    super(repository, BillerMask);
  }
} 
