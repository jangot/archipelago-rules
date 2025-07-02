/** Types generated for queries found in "apps/core/src/data/sql/get-user-detail.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetUserDetailById' parameters type */
export interface IGetUserDetailByIdParams {
  userId: string;
}

/** 'GetUserDetailById' return type */
export interface IGetUserDetailByIdResult {
  deletedAt: Date | null;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  phoneNumber: string;
}

/** 'GetUserDetailById' query type */
export interface IGetUserDetailByIdQuery {
  params: IGetUserDetailByIdParams;
  result: IGetUserDetailByIdResult;
}

const getUserDetailByIdIR: any = {
  usedParamSet: { userId: true },
  params: [{ name: 'userId', required: true, transform: { type: 'scalar' }, locs: [{ a: 36, b: 43 }] }],
  statement: 'SELECT * FROM core.users WHERE id = :userId! Limit 1',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM core.users WHERE id = :userId! Limit 1
 * ```
 */
export const getUserDetailById = new PreparedQuery<IGetUserDetailByIdParams, IGetUserDetailByIdResult>(getUserDetailByIdIR);
