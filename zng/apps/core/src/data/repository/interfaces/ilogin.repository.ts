import { IRepositoryBase } from '@library/shared/common/data';
import { Login } from '../../entity';
import { LoginType } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

/**
 * Interface representing a repository for managing authentication secrets.
 * Extends the base repository interface with additional methods specific to authentication secrets.
 *
 * @extends IRepositoryBase<Login>
 */
export interface ILoginRepository extends IRepositoryBase<Login> {
  /**
   * Retrieves a user's authentication secret by the specified type.
   *
   * @param userId - The unique identifier of the user.
   * @param type - The type of authentication secret to retrieve.
   * @returns A promise that resolves to the authentication secret if found, or null if not found.
   */
  getUserSecretByType(userId: string, type: LoginType): Promise<Login | null>;

  /**
   * Retrieves the first unfinished authentication secret of the specified type for the user.
   *
   * @param userId - The unique identifier of the user.
   * @param types - The types of authentication secrets to search for.
   * @returns A promise that resolves to the first unfinished authentication secret if found, or null if not found.
   * */
  getFirstUnfinished(userId: string, types: LoginType[]): Promise<Login | null>;

  /**
   * Creates Login if not existed yet, otherwise updates it. Default TypeORM createOrUpdate do not work properly with constrains.
   * @param login Login to create or update
   */
  createOrUpdate(login: DeepPartial<Login>): Promise<Login | null>;
}

export const ILoginRepository = Symbol('ILoginRepository');
