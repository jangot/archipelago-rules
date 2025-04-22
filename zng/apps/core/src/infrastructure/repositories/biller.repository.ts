import { Biller } from '@core/domain/entities';
import { IBillerRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BillerRepository extends RepositoryBase<Biller> implements IBillerRepository {
  private readonly logger: Logger = new Logger(BillerRepository.name);

  constructor(@InjectRepository(Biller) protected readonly repository: Repository<Biller>) {
    super(repository, Biller);
  }
}
