import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailyForecastModule1744894983201 implements MigrationInterface {
    name = 'AddDailyForecastModule1744894983201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mid_term_temp_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "regId" character varying NOT NULL, "forecastDate" character varying(8) NOT NULL, "minTemp" double precision NOT NULL, "maxTemp" double precision NOT NULL, "tmFc" character varying(10) NOT NULL, CONSTRAINT "UQ_6ff4bc422ba169f891a66d2bfc2" UNIQUE ("regId", "forecastDate"), CONSTRAINT "PK_563fafd7db42c313429154bd1e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "daily_forecast_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "regionName" character varying NOT NULL, "temperature" numeric(5,2) NOT NULL, "humidity" numeric(5,2) NOT NULL, "rainfall" numeric(5,2) NOT NULL, "windSpeed" numeric(5,2) NOT NULL, "windDirection" integer NOT NULL, "perceivedTemperature" numeric(5,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "region_id" uuid, CONSTRAINT "PK_f78527fe6986085cfde8d22e0a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "daily_forecast_entity" ADD CONSTRAINT "FK_32ea2d271075a513c8e0d09176d" FOREIGN KEY ("region_id") REFERENCES "region_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_forecast_entity" DROP CONSTRAINT "FK_32ea2d271075a513c8e0d09176d"`);
        await queryRunner.query(`DROP TABLE "daily_forecast_entity"`);
        await queryRunner.query(`DROP TABLE "mid_term_temp_entity"`);
    }

}
