import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoanTriggers1751925581534 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating Loan Triggers');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping Loan Triggers');
  }

}
