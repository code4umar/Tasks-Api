import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// This test drives real HTTP against a real (test) database, proving the
// wiring end to end — routing, validation pipe, auth module, bcrypt
// comparison, and JWT issuance all together.
//
// Prerequisite: a registered test user must exist. Run once before this
// test suite (or seed it):
//   POST /auth/register { name, email: "e2e@example.com", password: "testpassword123" }
describe('Auth (e2e)', () => {
  let app: INestApplication;
  const testEmail = 'e2e@example.com';
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Ensure the test user exists; ignore 409 (already registered) from a
    // prior run so this suite is repeatable.
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'E2E Test User',
      email: testEmail,
      password: testPassword,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login succeeds with correct credentials and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('POST /auth/login returns 401 with a wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrong-password' })
      .expect(401);

    expect(res.body.statusCode).toBe(401);
  });
});
