import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Login } from '../../domain/entities';
import { ILoginRepository } from '../../shared/interfaces/repositories';
import { ILogin } from '@library/entity/interface';

@Injectable()
export class LoginRepository extends RepositoryBase<Login> implements ILoginRepository {
  private readonly logger: Logger = new Logger(LoginRepository.name);

  constructor(
    @InjectRepository(Login)
    protected readonly repository: Repository<Login>
  ) {
    super(repository, Login);
  }

  public async createOrUpdate(login: DeepPartial<Login>): Promise<ILogin | null> {
    const existing = await this.findOneBy({ userId: login.userId, loginType: login.loginType });
    if (existing) {
      await this.update(existing.id, login);
      return this.findOneBy({ id: existing.id });
    }
    return this.insert(login, true);
  }

  public async getAllUserLogins(userId: string): Promise<ILogin[]> {
    return await this.repository.find({ where: { userId } });
  }

  public async getUserLoginForSecret(userId: string, secret: string, isAccessToken = false): Promise<ILogin | null> {
    this.logger.debug(`Looking by userId: ${userId} and secret: ${secret}`);
    const searchQuery: FindOptionsWhere<Login> = isAccessToken ? { userId, sessionId: secret } : { userId, secret };
    return await this.repository.findOneBy(searchQuery);
  }

  public async deleteUserLoginsByAccessToken(userId: string, accessToken: string): Promise<void> {
    await this.repository.delete({ userId, sessionId: accessToken });
  }
}
