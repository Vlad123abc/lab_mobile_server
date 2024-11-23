const request = require('supertest');
const app = require('../app'); // Adjust the path to your Express app

beforeAll((done) => {
  server = app.listen(3000, done); // Start the server before tests
});

afterAll((done) => {
  server.close(done); // Close the server after tests
});

describe('GET /', () => {
  it('should respond with Hello World', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello World');
  });
});
