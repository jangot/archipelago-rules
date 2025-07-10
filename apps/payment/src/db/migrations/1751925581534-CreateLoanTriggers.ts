import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoanTriggers1751925581534 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating Loan Triggers');

    // Create trigger function for state history
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION payments.loan_payments_state_history_fn()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- On INSERT: record initial state
        IF TG_OP = 'INSERT' THEN
          INSERT INTO payments.loan_payments_history(
            loan_payment_id,
            from_state,
            to_state,
            created_at
          ) VALUES (
            NEW.id,
            NULL,
            NEW.state,
            now()
          );
          RETURN NEW;
        END IF;

        -- On UPDATE: record only when state changes
        IF TG_OP = 'UPDATE' AND NEW.state IS DISTINCT FROM OLD.state THEN
          INSERT INTO payments.loan_payments_history(
            loan_payment_id,
            from_state,
            to_state,
            created_at
          ) VALUES (
            NEW.id,
            OLD.state,
            NEW.state,
            now()
          );
        END IF;

        RETURN NEW;
      END;
      $$;
    `);

    // Attach trigger to loan_payments table
    await queryRunner.query(`
      CREATE TRIGGER trg_loan_payments_state_history
      AFTER INSERT OR UPDATE OF state
      ON payments.loan_payments
      FOR EACH ROW
      EXECUTE FUNCTION payments.loan_payments_state_history_fn();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping Loan Triggers');

    // Remove trigger and function
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_loan_payments_state_history
      ON payments.loan_payments;
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS payments.loan_payments_state_history_fn();
    `);
  }

}
