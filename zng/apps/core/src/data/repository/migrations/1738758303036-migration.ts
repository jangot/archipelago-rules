import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738758303036 implements MigrationInterface {
    name = 'Migration1738758303036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phoneNumber" character varying NOT NULL, CONSTRAINT "UQ_47745627359dd6ef1c7cd5f8b1a" UNIQUE ("email"), CONSTRAINT "PK_42f0935cc814e694ed0e61fdece" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "loan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric NOT NULL, "lenderId" uuid NOT NULL, "borrowerId" uuid NOT NULL, CONSTRAINT "PK_4ceda725a323d254a5fd48bf95f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "loan" ADD CONSTRAINT "FK_f65e0d637eb6186f4f32e3602d0" FOREIGN KEY ("lenderId") REFERENCES "application_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan" ADD CONSTRAINT "FK_fff5adf4a8082e21349521e6d3c" FOREIGN KEY ("borrowerId") REFERENCES "application_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan" DROP CONSTRAINT "FK_fff5adf4a8082e21349521e6d3c"`);
        await queryRunner.query(`ALTER TABLE "loan" DROP CONSTRAINT "FK_f65e0d637eb6186f4f32e3602d0"`);
        await queryRunner.query(`DROP TABLE "loan"`);
        await queryRunner.query(`DROP TABLE "application_user"`);
    }

}
