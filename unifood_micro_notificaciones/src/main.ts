import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);

  console.log(` Microservicio de Comunicación corriendo en puerto ${PORT}`);
}
bootstrap();