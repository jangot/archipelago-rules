import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { AuthSecret } from '../../entity';
import { IAuthSecretRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSecretType } from '@library/entity/enum';

@Injectable()
export class AuthSecretRepository extends RepositoryBase<AuthSecret> implements IAuthSecretRepository {
  private readonly logger: Logger = new Logger(AuthSecretRepository.name);

  constructor(
    @InjectRepository(AuthSecret)
    protected readonly repository: Repository<AuthSecret>
  ) {
    super(repository, AuthSecret);
  }

  public async getUserSecretByType(userId: string, type: AuthSecretType): Promise<AuthSecret | null> {
    this.logger.debug(`getUserSecretByType: Getting secret for user: ${userId} and type: ${type}`);

    return await this.repository.findOneBy({ userId, type });
  }
}
