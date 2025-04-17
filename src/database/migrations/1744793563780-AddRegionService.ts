import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionService1744793563780 implements MigrationInterface {
    name = 'AddRegionService1744793563780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "region_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "parentId" character varying, "nx" integer, "ny" integer, CONSTRAINT "PK_387f37fbb418e96eddc9c95c83a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "locations_entity" ADD "regionId" uuid`);
        await queryRunner.query(`ALTER TABLE "locations_entity" ADD CONSTRAINT "FK_d83c372cbc233eff203e977bd9b" FOREIGN KEY ("regionId") REFERENCES "region_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations_entity" DROP CONSTRAINT "FK_d83c372cbc233eff203e977bd9b"`);
        await queryRunner.query(`ALTER TABLE "locations_entity" DROP COLUMN "regionId"`);
        await queryRunner.query(`DROP TABLE "region_entity"`);
    }

}
