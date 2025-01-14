const request = require('supertest');
const express = require('express');

let app, server;

beforeAll(async () => {
  // Import the actual index.js to start the server
  const index = require('./index'); // Adjust path as needed
  server = index.server;
  app = index.app; // Ensure you export app and server from index.js for testing
});

afterAll(async () => {
  // Close the server after tests
  server.close();
});

describe('Integration tests for index.js', () => {
  it('should respond with OK on /healthcheck', async () => {
    const res = await request(app).get('/healthcheck');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  // Add more tests here for additional routes
});
