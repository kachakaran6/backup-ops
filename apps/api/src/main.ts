import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API prefix (versioning)
  app.setGlobalPrefix('api/v1');

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BackupOps Control Plane API')
    .setDescription('Self-hosted infrastructure data operations and backup orchestration platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication and user session management')
    .addTag('users', 'User profiles and administrative management')
    .addTag('organizations', 'Workspaces and organizational membership')
    .addTag('resources', 'Infrastructure targets (servers, databases, storage)')
    .addTag('credentials', 'Encrypted credentials vault (AES-256-GCM)')
    .addTag('policies', 'Automation rules, schedules, and retention policies')
    .addTag('jobs', 'Asynchronous data operation execution, progress, and logs')
    .addTag('audit', 'Security and data movement audit trail')
    .addTag('health', 'System health check and liveness probe')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');

  console.log(`====================================================`);
  console.log(` BackupOps Control Plane API running on port ${port}`);
  console.log(` OpenAPI Docs: http://localhost:${port}/api/docs`);
  console.log(` Health Check: http://localhost:${port}/api/v1/health`);
  console.log(`====================================================`);
}

bootstrap();