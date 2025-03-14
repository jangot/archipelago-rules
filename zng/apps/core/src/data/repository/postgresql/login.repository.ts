import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Login } from '../../entity';
import { ILoginRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { LoginType } from '@library/entity/enum';

@Injectable()
export class LoginRepository extends RepositoryBase<Login> implements ILoginRepository {
  private readonly logger: Logger = new Logger(LoginRepository.name);

  constructor(
    @InjectRepository(Login)
    protected readonly repository: Repository<Login>
  ) {
    super(repository, Login);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getFirstUnfinished(_userId: string, _types: LoginType[]): Promise<Login | null> {
    return null;
    // return await this.repository.findOne({
    //   where: { userId, type: In(types), stage: Not(In(RegistrationCompletedStates)) },
    //   order: { updatedAt: `ASC` },
    // });
  }

  public async getUserSecretByType(userId: string, loginType: LoginType): Promise<Login | null> {
    this.logger.debug(`getUserSecretByType: Getting secret for user: ${userId} and type: ${loginType}`);

    return await this.repository.findOneBy({ userId, loginType });
  }

  public async createOrUpdate(login: DeepPartial<Login>): Promise<Login | null> {
    const existing = await this.findOneBy({ userId: login.userId, loginType: login.loginType });
    if (existing) {
      await this.update(existing.id, login);
      return this.findOneBy({ id: existing.id });
    }
    return this.insert(login, true);
  }

  public async getUserLogins(userId: string): Promise<Login[]> {
    return await this.repository.find({ where: { userId } });
  }
}
