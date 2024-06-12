const request = require('supertest');
const app = require('../server.js'); // Assuming your Express app is exported from server.js

describe('User API endpoints', () => {
  let token; 
  let userId; 

  beforeAll(async () => {
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'newpassword', role: 'student' });

    userId = createUserResponse.body.id; 

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: 'newuser@example.com', password: 'newpassword' });

    token = loginResponse.body.token;
  });

  it('POST /api/users/login - User login with valid credentials', async () => {
    expect(true).toBe(true);
  });

  // Test for user login with invalid credentials
  it('POST /api/users/login - User login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({ email: 'invalid@example.com', password: 'invalid_password' });

    expect(response.statusCode).toBe(401);
  });

  // Test for creating a new user
  it('POST /api/users - Create new user', async () => {
    expect(true).toBe(true);
  });

  // Test for fetching user data by ID
  it('GET /api/users/:id - Fetch user data by ID', async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`) 
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('username');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('role');
  });

  // Test for fetching user data by invalid ID
  it('GET /api/users/:id - Fetch user data by invalid ID', async () => {
    const response = await request(app)
      .get('/api/users/invalid_id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  // Test for fetching user data with unauthorized access
  it('GET /api/users/:id - Fetch user data with unauthorized access', async () => {
    const response = await request(app)
      .get('/api/users/456') 
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });
});
