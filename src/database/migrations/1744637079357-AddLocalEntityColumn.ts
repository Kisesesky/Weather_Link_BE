import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocalEntityColumn1744637079357 implements MigrationInterface {
    name = 'AddLocalEntityColumn1744637079357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations_entity" ADD "forecastCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations_entity" ADD "forecastStationCode" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations_entity" DROP COLUMN "forecastStationCode"`);
        await queryRunner.query(`ALTER TABLE "locations_entity" DROP COLUMN "forecastCode"`);
    }

}
