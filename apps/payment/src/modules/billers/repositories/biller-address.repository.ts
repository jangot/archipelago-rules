import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { BillerAddress } from '@library/shared/domain/entity/biller.address.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillerAddressRepository } from '../../../shared/interfaces/repositories/ibiller.address.repository';

/**
 * BillerAddressRepository handles DB operations for BillerAddress entities.
 */
@Injectable()
export class BillerAddressRepository extends RepositoryBase<BillerAddress> implements IBillerAddressRepository {
  private readonly logger: Logger = new Logger(BillerAddressRepository.name);

  constructor(
    @InjectRepository(BillerAddress)
    protected readonly repository: Repository<BillerAddress>,
  ) {
    super(repository, BillerAddress);
  }
} 
