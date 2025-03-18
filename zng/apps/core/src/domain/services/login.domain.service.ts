import { Injectable, Logger } from '@nestjs/common';
import { BaseDomainServices } from './domain.service.base';
import { LoginType } from '@library/entity/enum';
import { ILogin } from '@library/entity/interface';
import { DeepPartial } from 'typeorm';

@Injectable()
export class LoginDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(LoginDomainService.name);

  public async createOrUpdateLogin(login: DeepPartial<ILogin>): Promise<ILogin | null> {
    return this.data.logins.createOrUpdate(login);
  }

  public async updateLogin(loginId: string, login: DeepPartial<ILogin>): Promise<boolean | null> {
    return this.data.logins.update(loginId, login);
  }

  // #region Login related fetches
  public async getUserLoginByType(userId: string, loginType: LoginType): Promise<ILogin | null> {
    return this.data.logins.getUserLoginByType(userId, loginType);
  }

  public async getCurrentUserLogin(userId: string): Promise<ILogin | null> {
    return this.data.logins.getCurrentUserLogin(userId);
  }

  // #endregion
}
