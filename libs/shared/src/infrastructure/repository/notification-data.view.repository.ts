import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDataView } from '@library/shared/domain/entity/notification-data.vew';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { FindOptionsSelect } from 'typeorm/find-options/FindOptionsSelect';

@Injectable()
export class NotificationDataViewRepository {
  constructor(
    @InjectRepository(NotificationDataView)
    private readonly repository: Repository<NotificationDataView>,
  ) {}

  async findByUserId(userId: string, includeData: NotificationDataItems[]): Promise<NotificationDataView | null> {
    const select: FindOptionsSelect<NotificationDataView> = {};

    includeData.forEach((item) => {
      select[item] = true;
    });

    return this.repository.findOne({
      where: { userId },
      select,
    });
  }

  async initView(): Promise<void> {
    await this.repository.query(`DROP VIEW IF EXISTS notifications.notification_data CASCADE`);
    await this.repository.query(`
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
  }
}
