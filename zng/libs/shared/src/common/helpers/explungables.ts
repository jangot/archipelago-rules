import { IApplicationUser, ILogin, IUserRegistration } from '@library/entity/interface';

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
 * @param {IApplicationUser | null | undefined} user - The user object to be processed. Can be null or undefined.
 * @param {Array<keyof IApplicationUser>} fields - The fields to be omitted from the user object. Defaults to `['secret']`.
 * @returns {Partial<IApplicationUser> | null} - A partial user object with specified fields omitted, or null if the input was null.
 */
export const logSafeUser = (
  user: IApplicationUser | null | undefined,
  fields: Array<keyof IApplicationUser> = ['secret']
): Partial<IApplicationUser> | null => {
  if (!user) return null;
  const explungable = new ExplungableObject<IApplicationUser>();
  return explungable.omit(user, fields);
};

/**
 * Safely processes a user registration object by omitting specified fields.
 *
 * @param {IUserRegistration | null | undefined} registration - The user registration object to be processed. Can be null or undefined.
 * @param {Array<keyof IUserRegistration>} fields - The fields to be omitted from the user registration object. Defaults to `['secret']`.
 * @returns {Partial<IUserRegistration> | null} - A partial user registration object with specified fields omitted, or null if the input was null.
 */

export const logSafeRegistration = (
  registration: IUserRegistration | null | undefined,
  fields: Array<keyof IUserRegistration> = ['secret']
): Partial<IUserRegistration> | null => {
  if (!registration) return null;
  const explungable = new ExplungableObject<IUserRegistration>();
  return explungable.omit(registration, fields);
};

/**
 * Logs a safe version of the login object by omitting specified fields.
 *
 * @param {ILogin | null | undefined} login - The login object to be processed. Can be null or undefined.
 * @param {Array<keyof ILogin>} fields - An array of keys to be omitted from the login object. Defaults to `['secret']`.
 * @returns {Partial<ILogin> | null} - A partial login object with the specified fields omitted, or null if the login object is null or undefined.
 */
export const logSafeLogin = (login: ILogin | null | undefined, fields: Array<keyof ILogin> = ['secret']): Partial<ILogin> | null => {
  if (!login) return null;
  const explungable = new ExplungableObject<ILogin>();
  return explungable.omit(login, fields);
};
