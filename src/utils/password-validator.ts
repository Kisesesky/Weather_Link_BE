import { BadRequestException } from "@nestjs/common";


//비밀번호 검증
export function validatePassword(password: string) {
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
    if(!regex.test(password)) {
        throw new BadRequestException(
            '비밀번호는 최소 8자 이상이며, 문자, 숫자, 특수문자를 포함해야 합니다.',
          );
    }
    return true;
}