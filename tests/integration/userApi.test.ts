import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database';
import userRoutes from '../../src/routes/userRoutes';
import { User } from '../../src/entities/User';

const app = express();
app.use(express.json());
app.use('/user', userRoutes);

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize test database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    await AppDataSource.getRepository(User).delete({});
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('POST /user', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const response = await request(app)
        .post('/user')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.user).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('createdAt');
    });

    it('should return validation error for missing required fields', async () => {
      const userData = {
        firstName: 'John',
        // Missing required fields
      };

      const response = await request(app)
        .post('/user')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return error for invalid timezone', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'Invalid/Timezone',
      };

      const response = await request(app)
        .post('/user')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body.message).toContain('Invalid timezone');
    });
  });

  describe('PUT /user/:id', () => {
    it('should update an existing user successfully', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const createResponse = await request(app)
        .post('/user')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.user.id;

      // Then update it
      const updateData = {
        firstName: 'Jane',
        timezone: 'America/Los_Angeles',
      };

      const updateResponse = await request(app)
        .put(`/user/${userId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'User updated successfully');
      expect(updateResponse.body.user).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe', // Should remain unchanged
        timezone: 'America/Los_Angeles',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        firstName: 'Jane',
      };

      const response = await request(app)
        .put('/user/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('DELETE /user/:id', () => {
    it('should delete an existing user successfully', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const createResponse = await request(app)
        .post('/user')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.user.id;

      // Then delete it
      const deleteResponse = await request(app)
        .delete(`/user/${userId}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message', 'User deleted successfully');

      // Verify it's deleted by trying to get it
      await request(app)
        .get(`/user/${userId}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/user/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /user/:id', () => {
    it('should get an existing user successfully', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const createResponse = await request(app)
        .post('/user')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.user.id;

      // Then get it
      const getResponse = await request(app)
        .get(`/user/${userId}`)
        .expect(200);

      expect(getResponse.body.user).toMatchObject({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/user/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /user', () => {
    it('should get all users successfully', async () => {
      // Create multiple users
      const users = [
        {
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-05-15',
          timezone: 'America/New_York',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          birthDate: '1985-12-25',
          timezone: 'Europe/London',
        },
      ];

      for (const userData of users) {
        await request(app)
          .post('/user')
          .send(userData)
          .expect(201);
      }

      // Get all users
      const response = await request(app)
        .get('/user')
        .expect(200);

      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]).toHaveProperty('firstName');
      expect(response.body.users[1]).toHaveProperty('firstName');
    });

    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/user')
        .expect(200);

      expect(response.body.users).toHaveLength(0);
    });
  });
});