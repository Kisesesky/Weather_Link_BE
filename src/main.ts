import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as basicAuth from 'express-basic-auth';
import { DbConfigService } from 'src/config/db/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(DbConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 요청 데이터를 DTO 타입으로 변환
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: [
      'http://localhost:3000', // 개발용 프론트 주소
      'https://your-frontend.com', // 배포용 프론트 주소
    ],
    credentials: true,
  });

  //Swagger 암호화 .env development시 개방형열람, 배포이후 production으로 설정시 암호화열람
  if (configService.nodeEnv !== 'development') {
    app.use(
      ['/docs'],
      basicAuth({
        users: { admin: 'weatherlink123' },
        challenge: true,
        unauthorizedResponse: () => 'Unauthorized',
      }),
    );
  }

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Weather Link API')
    .setDescription('Weather Link API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('api/v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // Swagger JSON 파일로 저장
  const fs = require('fs');
  fs.writeFileSync(
    './src/docs/swagger/swagger-spec.json',
    JSON.stringify(document),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
