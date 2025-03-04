import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Login } from '../../entity';
import { ILoginRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { LoginType, RegistrationCompletedStates } from '@library/entity/enum';

@Injectable()
export class LoginRepository extends RepositoryBase<Login> implements ILoginRepository {
  private readonly logger: Logger = new Logger(LoginRepository.name);

  constructor(
    @InjectRepository(Login)
    protected readonly repository: Repository<Login>
  ) {
    super(repository, Login);
  }

  public async getFirstUnfinished(userId: string, types: LoginType[]): Promise<Login | null> {
    return await this.repository.findOne({
      where: { userId, type: In(types), stage: Not(In(RegistrationCompletedStates)) },
      order: { updatedAt: `ASC` },
    });
  }

  public async getUserSecretByType(userId: string, type: LoginType): Promise<Login | null> {
    this.logger.debug(`getUserSecretByType: Getting secret for user: ${userId} and type: ${type}`);

    return await this.repository.findOneBy({ userId, type });
  }
}
