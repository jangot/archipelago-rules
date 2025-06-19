import { Biller } from '@library/shared/domain/entities';
import { IBillerRepository } from '@core/shared/interfaces/repositories';
import { BillerTypeCodes } from '@library/entity/enum';
import { IBiller } from '@library/entity/interface';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class BillerRepository extends RepositoryBase<Biller> implements IBillerRepository {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(@InjectRepository(Biller) protected readonly repository: Repository<Biller>) {
    super(repository, Biller);
  }

  public async getAllCustomBillers(createdById: string): Promise<IBiller[] | null> {
    return this.repository.find({ where: { createdById, type: BillerTypeCodes.Custom } });
  }

  public async createBiller(biller: DeepPartial<Biller>): Promise<Biller | null> {
    this.logger.debug('createBiller:', biller);

    return this.insert(biller, true);
  }

}
