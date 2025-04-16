import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatModule1744784223120 implements MigrationInterface {
    name = 'AddChatModule1744784223120'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" uuid, "chatRoomId" uuid, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "locationId" uuid, CONSTRAINT "PK_c69082bd83bffeb71b0f455bd59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_room_participants" ("chatRoomId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_975478c2fa15ea91a55d8e08e47" PRIMARY KEY ("chatRoomId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_45f001549563ec90b01f8f0100" ON "chat_room_participants" ("chatRoomId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2b9c65aa497b5b69da6ad4dfc9" ON "chat_room_participants" ("userId") `);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_f3cc0ca0c4b191410f1e0ab5d21" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_4d4d620f34c59c2587ef7ba7f4c" FOREIGN KEY ("locationId") REFERENCES "locations_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_45f001549563ec90b01f8f01008" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91"`);
        await queryRunner.query(`ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_45f001549563ec90b01f8f01008"`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_4d4d620f34c59c2587ef7ba7f4c"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_f3cc0ca0c4b191410f1e0ab5d21"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b9c65aa497b5b69da6ad4dfc9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45f001549563ec90b01f8f0100"`);
        await queryRunner.query(`DROP TABLE "chat_room_participants"`);
        await queryRunner.query(`DROP TABLE "chat_rooms"`);
        await queryRunner.query(`DROP TABLE "message"`);
    }

}
