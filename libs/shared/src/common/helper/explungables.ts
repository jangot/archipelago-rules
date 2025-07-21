import { ApplicationUser, Login, UserRegistration } from '@library/shared/domain/entity';

export class ExplungableObject<Full extends object> {
  /** Omits the specified fields, ensuring they are keys of 'Full'. */
  omit<K extends keyof Full>(obj: Full, fields: K[]): Omit<Full, K> {
    const result = { ...obj };
    fields.forEach((field) => {
      delete result[field];
    });
    return result as Omit<Full, K>;
  }

  /** Picks the specified fields, ensuring they are keys of 'Full'. */
  pick<K extends keyof Full>(obj: Full, fields: K[]): Pick<Full, K> {
    const result: Partial<Full> = {};
    for (const field of fields) {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
    return result as Pick<Full, K>;
  }
}

/**
 * Safely processes a user object by omitting specified fields.
 * @param {ApplicationUser | null | undefined} user - The user object to be processed. Can be null or undefined.
 * @param {Array<keyof ApplicationUser>} fields - The fields to be omitted from the user object. Defaults to `['secret']`.
 * @returns {Partial<ApplicationUser> | null} - A partial user object with specified fields omitted, or null if the input was null.
 */
export const logSafeUser = (
  user: ApplicationUser | null | undefined,
  fields: Array<keyof ApplicationUser> = ['secret']
): Partial<ApplicationUser> | null => {
  if (!user) return null;
  const explungable = new ExplungableObject<ApplicationUser>();
  return explungable.omit(user, fields);
};

/**
 * Safely processes a user registration object by omitting specified fields.
 *
 * @param {UserRegistration | null | undefined} registration - The user registration object to be processed. Can be null or undefined.
 * @param {Array<keyof UserRegistration>} fields - The fields to be omitted from the user registration object. Defaults to `['secret']`.
 * @returns {Partial<UserRegistration> | null} - A partial user registration object with specified fields omitted, or null if the input was null.
 */

export const logSafeRegistration = (
  registration: UserRegistration | null | undefined,
  fields: Array<keyof UserRegistration> = ['secret']
): Partial<UserRegistration> | null => {
  if (!registration) return null;
  const explungable = new ExplungableObject<UserRegistration>();
  return explungable.omit(registration, fields);
};

/**
 * Logs a safe version of the login object by omitting specified fields.
 *
 * @param {Login | null | undefined} login - The login object to be processed. Can be null or undefined.
 * @param {Array<keyof Login>} fields - An array of keys to be omitted from the login object. Defaults to `['secret']`.
 * @returns {Partial<Login> | null} - A partial login object with the specified fields omitted, or null if the login object is null or undefined.
 */
export const logSafeLogin = (login: Login | null | undefined, fields: Array<keyof Login> = ['secret']): Partial<Login> | null => {
  if (!login) return null;
  const explungable = new ExplungableObject<Login>();
  return explungable.omit(login, fields);
};
