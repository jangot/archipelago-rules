import { IBillerRepository } from '@core/shared/interfaces/repositories';
import { IBiller } from '@library/entity/entity-interface';
import { BillerTypeCodes } from '@library/entity/enum';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Biller } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BillerRepository extends RepositoryBase<Biller> implements IBillerRepository {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(@InjectRepository(Biller) protected readonly repository: Repository<Biller>) {
    super(repository, Biller);
  }

  public async getAllCustomBillers(createdById: string): Promise<IBiller[] | null> {
    return this.repository.find({ where: { createdById, type: BillerTypeCodes.Custom } });
  }

  public async createBiller(biller: Partial<Biller>): Promise<Biller | null> {
    this.logger.debug('createBiller:', biller);

    return this.insert(biller, true);
  }

}
