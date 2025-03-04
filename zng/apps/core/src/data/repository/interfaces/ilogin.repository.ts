import { IRepositoryBase } from '@library/shared/common/data';
import { Login } from '../../entity';
import { AuthSecretType } from '@library/entity/enum';

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
  getUserSecretByType(userId: string, type: AuthSecretType): Promise<Login | null>;
}

export const ILoginRepository = Symbol('ILoginRepository');
