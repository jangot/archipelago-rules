import { EntityId } from '@library/shared/common/data';
import { RegistrationStage, RegistrationType } from '../enum';

/**
 * Interface representing a registration entity.
 *
 * @extends EntityId<string>
 */
export interface IRegistration extends EntityId<string> {
  /**
   * Unique identifier for the registration.
   */
  id: string;

  /**
   * Type of the registration.
   *
   * @see RegistrationType
   */
  type: RegistrationType;

  /**
   * Current stage of the registration process.
   *
   * @see RegistrationStage
   */
  stage: RegistrationStage;

  /**
   * Optional data associated with the registration.
   * Can be a string or null.
   */
  data?: string | null;

  /**
   * Optional secret associated with the registration.
   * Can be a string or null.
   */
  secret?: string | null;

  /**
   * Optional expiration date of the registration.
   * Can be a Date object or null.
   */
  expiresAt?: Date | null;

  /**
   * Optional number of retries allowed for the registration.
   * Can be a number or null.
   */
  retries?: number | null;

  /**
   * Optional date when the registration unlocks.
   * Can be a Date object or null.
   */
  unlocksAt?: Date | null;
}

export interface OrganicRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}
