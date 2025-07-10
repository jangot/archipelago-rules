import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { BillerName } from '@library/shared/domain/entity/biller.name.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillerNameRepository } from '../../../shared/interfaces/repositories/ibiller.name.repository';

/**
 * BillerNameRepository handles DB operations for BillerName entities.
 */
@Injectable()
export class BillerNameRepository extends RepositoryBase<BillerName> implements IBillerNameRepository {
  private readonly logger: Logger = new Logger(BillerNameRepository.name);

  constructor(
    @InjectRepository(BillerName)
    protected readonly repository: Repository<BillerName>,
  ) {
    super(repository, BillerName);
  }

  public async createBillerName(billerName: BillerName): Promise<BillerName> {
    return this.repository.create(billerName);
  }

  public async updateBillerName(billerName: BillerName): Promise<void> {
    await this.repository.update(billerName.id, billerName);
  }
} 
