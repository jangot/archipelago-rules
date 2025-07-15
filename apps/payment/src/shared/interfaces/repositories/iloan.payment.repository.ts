import { ILoanPayment } from '@library/entity/entity-interface/iloan-payment';
import { IRepositoryBase } from '@library/shared/common/data';
import { LoanPaymentRelation } from '@library/shared/domain/entity/relation';
 
export interface ILoanPaymentRepository extends IRepositoryBase<ILoanPayment> {
  getPaymentById(id: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment | null>;
  getPaymentsByIds(paymentIds: string[], relations: LoanPaymentRelation[] | undefined): Promise<ILoanPayment[] | null>;
  updatePayment(id: string, updates: Partial<ILoanPayment>): Promise<boolean | null>;
  createPayment(input: Partial<ILoanPayment>): Promise<ILoanPayment | null>;
  createPayments(payments: Partial<ILoanPayment>[]): Promise<ILoanPayment[] | null>;
}

export const ILoanPaymentRepository = Symbol('ILoanPaymentRepository');
