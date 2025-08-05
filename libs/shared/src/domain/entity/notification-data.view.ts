import { ViewColumn, ViewEntity } from 'typeorm';

export interface UserJson {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface LoanJson {
  id: string;
  amount: number;
  loanType: string;
  lenderId?: string;
  borrowerId?: string;
  createdAt: string;
}

@ViewEntity({
  schema: 'notifications',
  name: 'v_notification_data',
  synchronize: false,
})
export class NotificationDataView {
  @ViewColumn({ name: 'user_id' })
  userId: string;

  @ViewColumn({ name: 'lend_id' })
  lendId: string | null;

  @ViewColumn({ name: 'borrow_id' })
  borrowId: string | null;

  @ViewColumn()
  user: UserJson;

  @ViewColumn({ name: 'lender_loan' })
  lenderLoan: LoanJson | null;

  @ViewColumn({ name: 'borrower_loan' })
  borrowerLoan: LoanJson | null;
}
