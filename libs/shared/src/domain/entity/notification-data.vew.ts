import { ViewEntity, ViewColumn, DataSource } from 'typeorm';

export interface UserJson {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  secret: string;
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
  name: 'notification_data',
  expression: async (dataSource: DataSource) => {
    await dataSource.query(`DROP VIEW IF EXISTS notifications.notification_data CASCADE`);
    await dataSource.query(`
      SELECT
        u.id AS user_id,
        l_lend.id as lend_id,
        l_borrow.id as borrow_id,
        u.secret as code,
        jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'phone_number', u.phone_number
        ) AS user,
        CASE WHEN l_lend.id IS NOT NULL THEN jsonb_build_object(
          'id', l_lend.id,
          'amount', l_lend.amount,
          'loan_type', l_lend.type,
          'borrower_id', l_lend.borrower_id,
          'created_at', l_lend.created_at
        ) END AS lender_loan,
        CASE WHEN l_borrow.id IS NOT NULL THEN jsonb_build_object(
          'id', l_borrow.id,
          'amount', l_borrow.amount,
          'loan_type', l_borrow.type,
          'lender_id', l_borrow.lender_id,
          'created_at', l_borrow.created_at
        ) END AS borrower_loan
      FROM core.users u 
      LEFT JOIN core.loans l_lend ON l_lend.lender_id = u.id
      LEFT JOIN core.loans l_borrow ON l_borrow.borrower_id = u.id
    `);
  },
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

  @ViewColumn()
  code: string;

  @ViewColumn({ name: 'lender_loan' })
  lenderLoan: LoanJson | null;

  @ViewColumn({ name: 'borrower_loan' })
  borrowerLoan: LoanJson | null;
}
