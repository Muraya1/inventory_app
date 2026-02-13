import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for mobile app access
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const swaggerPath = 'api-docs';
  const config = new DocumentBuilder()
    .setTitle('Inventory Management API')
    .setDescription('REST API for inventory management system with authentication and order processing')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Prevent CDN/browser caching of Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      .swagger-ui .info .title {
        font-size: 2.5rem;
        color: #1a202c;
        font-weight: 700;
      }
      .swagger-ui .info .description {
        color: #4a5568;
        font-size: 1rem;
        line-height: 1.6;
      }
      .swagger-ui .opblock-tag {
        font-size: 1.5rem;
        color: #2d3748;
        font-weight: 600;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
      }
      .swagger-ui .opblock {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
      }
      .swagger-ui .opblock .opblock-summary {
        padding: 1rem;
      }
      .swagger-ui .btn {
        border-radius: 6px;
        font-weight: 500;
      }
      .swagger-ui .opblock.opblock-post {
        border-color: #48bb78;
        background: rgba(72, 187, 120, 0.05);
      }
      .swagger-ui .opblock.opblock-get {
        border-color: #4299e1;
        background: rgba(66, 153, 225, 0.05);
      }
      .swagger-ui .opblock.opblock-put {
        border-color: #ed8936;
        background: rgba(237, 137, 54, 0.05);
      }
      .swagger-ui .opblock.opblock-delete {
        border-color: #f56565;
        background: rgba(245, 101, 101, 0.05);
      }
      .swagger-ui .scheme-container {
        background: #f7fafc;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #e2e8f0;
      }
    `,
    customSiteTitle: 'Inventory Management API',
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📦</text></svg>',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/${swaggerPath}`);
}

bootstrap();
