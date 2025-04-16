import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAgreed1744815078897 implements MigrationInterface {
    name = 'AddUserAgreed1744815078897'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "termsAgreed" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationAgreed" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationAgreed"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAgreed"`);
    }

}
