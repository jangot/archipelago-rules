import { LoanPaymentRelation } from '@library/shared/domain/entities/relations';
import { ILoanPayment } from '@library/entity/interface/iloan-payment';
import { IRepositoryBase } from '@library/shared/common/data';
import { DeepPartial } from 'typeorm';

 
export interface ILoanPaymentRepository extends IRepositoryBase<ILoanPayment> {
  getPaymentById(id: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment | null>;
  updatePayment(id: string, updates: DeepPartial<ILoanPayment>): Promise<boolean | null>;
}

export const ILoanPaymentRepository = Symbol('ILoanPaymentRepository');
