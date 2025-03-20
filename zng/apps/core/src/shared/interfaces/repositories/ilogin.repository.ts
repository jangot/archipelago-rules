import { IRepositoryBase } from '@library/shared/common/data';
import { LoginType } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { ILogin } from '@library/entity/interface';

/**
 * Interface representing a repository for managing authentication secrets.
 * Extends the base repository interface with additional methods specific to authentication secrets.
 *
 * @extends IRepositoryBase<Login>
 */
export interface ILoginRepository extends IRepositoryBase<ILogin> {
  /**
   * Retrieves a user's authentication secret by the specified type.
   *
   * @param userId - The unique identifier of the user.
   * @param type - The type of authentication secret to retrieve.
   * @returns A promise that resolves to the authentication secret if found, or null if not found.
   */
  getUserLoginByType(userId: string, type: LoginType): Promise<ILogin | null>;

  /**
   * Retrieves the first unfinished authentication secret of the specified type for the user.
   *
   * @param userId - The unique identifier of the user.
   * @param types - The types of authentication secrets to search for.
   * @returns A promise that resolves to the first unfinished authentication secret if found, or null if not found.
   * */
  getFirstUnfinished(userId: string, types: LoginType[]): Promise<ILogin | null>;

  /**
   * Creates Login if not existed yet, otherwise updates it. Default TypeORM createOrUpdate do not work properly with constrains.
   * @param login Login to create or update
   */
  createOrUpdate(login: DeepPartial<ILogin>): Promise<ILogin | null>;

  /**
   * Retrieves all user logins by user ID.
   * @param userId The user ID.
   * @returns A promise that resolves to an array of user logins.
   */
  getUserLogins(userId: string): Promise<ILogin[]>;

  /**
   * Retrieves the current user login by user ID.
   * @param userId The user ID.
   * @returns A promise that resolves to the current user login.
   */
  getCurrentUserLogin(userId: string): Promise<ILogin | null>;

  /**
   * Retrieves a user login for a specific secret.
   * @param userId The user ID.
   * @param secret The secret (currently refreshToken hash).
   * @returns A promise that resolves to the user login if found, or null if not found.
   */
  getUserLoginForSecret(userId: string, secret: string): Promise<ILogin | null>;
}

export const ILoginRepository = Symbol('ILoginRepository');
