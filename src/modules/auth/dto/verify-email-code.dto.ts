import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString } from "class-validator"

export class VerifyEmailCodeDto {
    @ApiProperty({
        example: 'test@test.com',
        description: '이메일 주소'
    })
    @IsEmail()
    email: string

    @ApiProperty({
        example: '123456',
        description: '인증 코드'
    })
    @IsString()
    code: string
}