import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDataView } from '@library/shared/domain/entity/notification-data.view';
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
    await this.repository.query(`DROP VIEW IF EXISTS notifications.v_notification_data CASCADE`);
    await this.repository.query(`
      CREATE VIEW notifications.v_notification_data AS
      SELECT
        u.id AS user_id,
        l_lend.id as lend_id,
        l_borrow.id as borrow_id,
        u.secret as code,
        jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'phoneNumber', u.phone_number
        ) AS user,
        CASE WHEN l_lend.id IS NOT NULL THEN jsonb_build_object(
          'id', l_lend.id,
          'amount', l_lend.amount,
          'loanType', l_lend.type,
          'borrowerId', l_lend.borrower_id,
          'createdAt', l_lend.created_at
        ) END AS lender_loan,
        CASE WHEN l_borrow.id IS NOT NULL THEN jsonb_build_object(
          'id', l_borrow.id,
          'amount', l_borrow.amount,
          'loanType', l_borrow.type,
          'lenderId', l_borrow.lender_id,
          'createdAt', l_borrow.created_at
        ) END AS borrower_loan
      FROM core.users u 
      LEFT JOIN core.loans l_lend ON l_lend.lender_id = u.id
      LEFT JOIN core.loans l_borrow ON l_borrow.borrower_id = u.id
    `);
  }
}
