import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlertSettingAndLog1745304672298 implements MigrationInterface {
    name = 'AddAlertSettingAndLog1745304672298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "alert_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actualValue" double precision NOT NULL, "unit" character varying(10) NOT NULL, "type" character varying(50) NOT NULL, "message" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "alertSettingId" uuid, CONSTRAINT "PK_839d59dc0124b583ee4233a7df9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "alert_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL, "threshold" double precision NOT NULL, "unit" character varying NOT NULL, "active" boolean NOT NULL, "userId" uuid, CONSTRAINT "PK_9f318561ba481069150ca1fff62" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "alert_logs" ADD CONSTRAINT "FK_541d8c3b8cc12013e978dde67b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_logs" ADD CONSTRAINT "FK_39b80cabe2feb23fed9657e867d" FOREIGN KEY ("alertSettingId") REFERENCES "alert_settings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_26bad7861d4026bb22407614f77" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_26bad7861d4026bb22407614f77"`);
        await queryRunner.query(`ALTER TABLE "alert_logs" DROP CONSTRAINT "FK_39b80cabe2feb23fed9657e867d"`);
        await queryRunner.query(`ALTER TABLE "alert_logs" DROP CONSTRAINT "FK_541d8c3b8cc12013e978dde67b3"`);
        await queryRunner.query(`DROP TABLE "alert_settings"`);
        await queryRunner.query(`DROP TABLE "alert_logs"`);
    }

}
