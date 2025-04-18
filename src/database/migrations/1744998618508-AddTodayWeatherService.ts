import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTodayWeatherService1744998618508 implements MigrationInterface {
    name = 'AddTodayWeatherService1744998618508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "today_forecast_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "forecastDateTime" TIMESTAMP NOT NULL, "temperature" double precision, "skyCondition" character varying(50), "rainProbability" double precision, "precipitationType" character varying(50), "humidity" double precision, "snowfall" character varying(50), "collectedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "regionId" uuid, CONSTRAINT "PK_49273b57ab5ce9cf8a73a951fd1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "today_forecast_entity" ADD CONSTRAINT "FK_cfa4ba9ca2b6670e42d040a8675" FOREIGN KEY ("regionId") REFERENCES "region_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "today_forecast_entity" DROP CONSTRAINT "FK_cfa4ba9ca2b6670e42d040a8675"`);
        await queryRunner.query(`DROP TABLE "today_forecast_entity"`);
    }

}
