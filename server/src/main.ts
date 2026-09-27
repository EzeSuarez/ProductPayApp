import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './common/infrastructure/filters/problem-details.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // OWASP Security: HTTP headers (disable CSP for HTTP deployment)
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global RFC 7807 Problem Details filter
  app.useGlobalFilters(new ProblemDetailsFilter());

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ProductPay API')
    .setDescription(
      'Clean Hexagonal Architecture API for Product Payments & Checkout Saga'
    )
    .setVersion('1.0.0')
    .addTag('Products', 'Product Catalog & Stock Management')
    .addTag('Transactions', 'Checkout & Payment Lifecycle')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 21000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on: http://localhost:${port}/api`);
  logger.log(`Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
