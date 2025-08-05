import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1752000000000 implements MigrationInterface {
  name = 'Migration1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'core' 
      AND table_name = 'biller' 
      AND column_name = 'crc32'
    `);
    
    if (columnInfo.length > 0 && columnInfo[0].data_type === 'integer') {
      await queryRunner.query(
        'ALTER TABLE "core"."biller" ALTER COLUMN "crc32" TYPE bigint USING crc32::bigint'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'core' 
      AND table_name = 'biller' 
      AND column_name = 'crc32'
    `);
    
    if (columnInfo.length > 0 && columnInfo[0].data_type === 'bigint') {
      await queryRunner.query(
        'ALTER TABLE "core"."biller" ALTER COLUMN "crc32" TYPE integer USING crc32::integer'
      );
    }
  }
} 
