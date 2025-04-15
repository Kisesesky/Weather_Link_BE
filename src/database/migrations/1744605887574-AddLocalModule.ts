import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalModule1744605887574 implements MigrationInterface {
  name = 'AddLocalModule1744605887574';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "location" TO "locationId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "locations_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kmaRegionCode" character varying NOT NULL, "alertRegionCode" character varying NOT NULL, "stationCode" character varying NOT NULL, "sido" character varying NOT NULL, "gugun" character varying, "dong" character varying, "nx" integer, "ny" integer, "longitude" double precision, "latitude" double precision, CONSTRAINT "PK_f8fc6b8d96458dc030a2728ffb0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationId"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "locationId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_49acb911ee20b02f86ec532a122" FOREIGN KEY ("locationId") REFERENCES "locations_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_49acb911ee20b02f86ec532a122"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationId"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "locationId" character varying(255)`,
    );
    await queryRunner.query(`DROP TABLE "locations_entity"`);
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "locationId" TO "location"`,
    );
  }
}
