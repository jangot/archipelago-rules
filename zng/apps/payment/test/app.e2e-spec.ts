import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentModule } from '../src/payment.module';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Use complete application with real services to test the full system integration
describe('PaymentController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check Endpoint', () => {
    it('should return health check message when GET /', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('should respond with correct content type when GET /', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Content-Type', /text/)
        .expect('Hello World!');
    });
  });

  describe('API Availability', () => {
    it('should have payment service running and accessible', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.text).toBe('Hello World!');
    });
  });
});
