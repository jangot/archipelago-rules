import { ILoanPayment } from '@library/entity/interface/iloan-payment';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ILoanPaymentRepository extends IRepositoryBase<ILoanPayment> {}

export const ILoanPaymentRepository = Symbol('ILoanPaymentRepository');
