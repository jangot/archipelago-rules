import { IRepositoryBase } from '@library/shared/common/data';
import { DeepPartial } from 'typeorm';
import { ILogin } from '@library/entity/entity-interface';

/**
 * Interface representing a repository for managing authentication secrets.
 * Extends the base repository interface with additional methods specific to authentication secrets.
 *
 * @extends IRepositoryBase<Login>
 */
export interface ILoginRepository extends IRepositoryBase<ILogin> {
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
  getAllUserLogins(userId: string): Promise<ILogin[]>;

  /**
   * Retrieves a user login for a specific secret.
   * @param userId The user ID.
   * @param secret The secret (currently refreshToken hash).
   * @param isAccessToken Indicates whether the secret is an access token.
   * @returns A promise that resolves to the user login if found, or null if not found.
   */
  getUserLoginForSecret(userId: string, secret: string, isAccessToken?: boolean): Promise<ILogin | null>;

  /**
   * Deletes user logins by types.
   * @param userId The user ID.
   * @param types The types of logins to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  deleteUserLoginsByAccessToken(userId: string, accessToken: string): Promise<void>;
}

export const ILoginRepository = Symbol('ILoginRepository');
