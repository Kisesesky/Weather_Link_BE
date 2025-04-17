import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAgreed1744856265460 implements MigrationInterface {
  name = 'AddUserAgreed1744856265460';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "termsAgreed" boolean NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "locationAgreed" boolean NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationAgreed"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAgreed"`);
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
