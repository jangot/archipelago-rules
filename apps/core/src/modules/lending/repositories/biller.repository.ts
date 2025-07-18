import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Biller } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillerTypeCodes } from '@library/entity/enum';

@Injectable()
export class BillerRepository extends RepositoryBase<Biller> {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(
    @InjectRepository(Biller)
    protected readonly repository: Repository<Biller>
  ) {
    super(repository, Biller);
  }

  public async getAllCustomBillers(createdById: string): Promise<Biller[] | null> {
    return this.repository.find({ where: { createdById, type: BillerTypeCodes.Custom } });
  }

  public async createBiller(biller: Partial<Biller>): Promise<Biller | null> {
    this.logger.debug('createBiller:', biller);

    return this.insert(biller, true);
  }

}
