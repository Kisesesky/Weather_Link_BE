import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserEntity1744373420358 implements MigrationInterface {
    name = 'FixUserEntity1744373420358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_51b8b26ac168fbe7d6f5653e6cf" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TYPE "public"."users_register_type_enum" RENAME TO "users_register_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_register_type_enum" AS ENUM('EMAIL', 'GOOGLE', 'KAKAO', 'NAVER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" TYPE "public"."users_register_type_enum" USING "register_type"::"text"::"public"."users_register_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" SET DEFAULT 'EMAIL'`);
        await queryRunner.query(`DROP TYPE "public"."users_register_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "theme"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "theme" "public"."users_theme_enum" NOT NULL DEFAULT 'light'`);
        await queryRunner.query(`COMMENT ON COLUMN "users"."theme" IS '사용자 테마 설정 (light 또는 dark)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "users"."theme" IS '사용자 테마 설정 (light 또는 dark)'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "theme"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "theme" character varying(20) NOT NULL DEFAULT 'light'`);
        await queryRunner.query(`CREATE TYPE "public"."users_register_type_enum_old" AS ENUM('common', 'google', 'kakao', 'naver')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" TYPE "public"."users_register_type_enum_old" USING "register_type"::"text"::"public"."users_register_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "register_type" SET DEFAULT 'common'`);
        await queryRunner.query(`DROP TYPE "public"."users_register_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_register_type_enum_old" RENAME TO "users_register_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_51b8b26ac168fbe7d6f5653e6cf"`);
    }

}
