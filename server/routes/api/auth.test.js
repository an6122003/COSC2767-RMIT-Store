const request = require('supertest');
const express = require('express');
const router = require('./auth'); // Adjust the path if necessary

const app = express();
app.use(express.json());
app.use('/api/auth', router);

describe('Auth Routes', () => {
  test('should respond to /login with 400 if email is missing', async () => {
    const response = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter an email address.');
  });

  test('should respond to /login with 400 if password is missing', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter a password.');
  });

  test('should respond to /register with 400 if email is missing', async () => {
    const response = await request(app).post('/api/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter an email address.');
  });

  test('should respond to /register with 400 if full name is missing', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter your full name.');
  });

  test('should respond to /register with 400 if password is missing', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter a password.');
  });

  test('should respond to /forgot with 400 if email is missing', async () => {
    const response = await request(app).post('/api/auth/forgot').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter an email address.');
  });

  test('should respond to /reset/:token with 400 if password is missing', async () => {
    const response = await request(app).post('/api/auth/reset/some-token').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You must enter a password.');
  });

});
