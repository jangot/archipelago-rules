import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Registration } from '../../entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IRegistrationRepository } from '../interfaces';

export class RegistrationRepository extends RepositoryBase<Registration> implements IRegistrationRepository {
  private readonly logger: Logger = new Logger(RegistrationRepository.name);

  constructor(
    @InjectRepository(Registration)
    protected readonly repository: Repository<Registration>
  ) {
    super(repository, Registration);
  }
}
