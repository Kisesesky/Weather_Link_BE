import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWeatherModule1745295149825 implements MigrationInterface {
    name = 'FixWeatherModule1745295149825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mid_term_forecast_entity" ADD "regionId" uuid`);
        await queryRunner.query(`ALTER TABLE "mid_term_temp_entity" ADD "regionId" uuid`);
        await queryRunner.query(`ALTER TABLE "mid_term_forecast_entity" ADD CONSTRAINT "FK_0902a45cec7075304f948362a80" FOREIGN KEY ("regionId") REFERENCES "region_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mid_term_temp_entity" ADD CONSTRAINT "FK_d876e1d5d27fe005a6f71f21e96" FOREIGN KEY ("regionId") REFERENCES "region_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mid_term_temp_entity" DROP CONSTRAINT "FK_d876e1d5d27fe005a6f71f21e96"`);
        await queryRunner.query(`ALTER TABLE "mid_term_forecast_entity" DROP CONSTRAINT "FK_0902a45cec7075304f948362a80"`);
        await queryRunner.query(`ALTER TABLE "mid_term_temp_entity" DROP COLUMN "regionId"`);
        await queryRunner.query(`ALTER TABLE "mid_term_forecast_entity" DROP COLUMN "regionId"`);
    }

}
