import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Blog CMS API')
    .setDescription(
      'A Blog Content Management REST API with 3 roles — Admin, Author and Reader. Supports content lifecycle, many-to-many tags, comments and admin panel.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'access-token',
    )
    .addTag('Auth', 'Register, login, refresh token, logout')
    .addTag('Categories', 'Blog post categories — admin managed')
    .addTag('Tags', 'Blog post tags with many-to-many — admin managed')
    .addTag('Posts', 'Blog posts with content lifecycle management')
    .addTag('Comments', 'Comments and likes on posts')
    .addTag('Admin', 'Admin panel — user and content management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 5000);
  console.log(
    `Server running on http://localhost:${process.env.PORT ?? 5000}/api/v1`,
  );
  console.log(
    `Swagger docs at http://localhost:${process.env.PORT ?? 5000}/api/docs`,
  );
}
bootstrap();