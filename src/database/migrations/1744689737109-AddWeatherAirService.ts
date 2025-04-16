import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeatherAirService1744689737109 implements MigrationInterface {
  name = 'AddWeatherAirService1744689737109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "weather_air_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sido" character varying NOT NULL, "gugun" character varying NOT NULL, "dataTime" TIMESTAMP NOT NULL, "pm10Value" character varying NOT NULL, "pm25Value" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2e1a21c625d52a67ae024adbd59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_38ac15630bb68e2937241fceae" ON "weather_air_entity" ("sido", "gugun", "dataTime") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38ac15630bb68e2937241fceae"`,
    );
    await queryRunner.query(`DROP TABLE "weather_air_entity"`);
  }
}
