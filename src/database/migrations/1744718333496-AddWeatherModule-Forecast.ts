import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeatherModuleForecast1744718333496 implements MigrationInterface {
    name = 'AddWeatherModuleForecast1744718333496'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mid_term_forecast_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "regId" character varying NOT NULL, "forecastDate" character varying NOT NULL, "forecastTime" character varying NOT NULL, "sky" character varying NOT NULL, "pre" character varying NOT NULL, "rnSt" integer NOT NULL, CONSTRAINT "PK_0fdaedd557d725224288e66dc7e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mid_term_forecast_entity"`);
    }

}
