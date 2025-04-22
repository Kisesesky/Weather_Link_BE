# 1. Node.js LTS 버전 사용
FROM node:22

# 2. 작업 디렉토리 생성 및 이동
WORKDIR /usr/src/app

# 3. package.json 및 package-lock.json 복사
COPY package*.json ./

# 4. 패키지 설치
RUN npm install --legacy-peer-deps

# 5. nest-cli 글로벌 설치
RUN npm install -g @nestjs/cli

# 6. 글로벌 npm bin 디렉토리를 PATH에 추가
ENV PATH=/usr/local/lib/node_modules/.bin:$PATH

# 7. 소스 코드 복사
COPY . .

# 8. NestJS 앱 빌드
RUN npm run build

# 9. 실행할 포트 지정
EXPOSE 3000

# 9. wait-for-it.sh 스크립트 추가
COPY scripts/wait-for-it.sh ./scripts/wait-for-it.sh
RUN chmod +x ./scripts/wait-for-it.sh

# 10. 실행 명령 수정 (상대 경로로)
CMD ["./scripts/wait-for-it.sh", "database:5433", "--", "sh", "-c", "npm run migration:run && npm run start:prod"]
# CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]