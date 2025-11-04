import { UserService } from '../../src/services/UserService';
import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/entities/User';

describe('UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    // Initialize test database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    userService = new UserService();
    // Clean up database before each test
    await AppDataSource.getRepository(User).delete({});
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.birthDay).toBe(15);
      expect(user.birthMonth).toBe(5);
      expect(user.timezone).toBe('America/New_York');
      expect(user.fullName).toBe('John Doe');
    });

    it('should throw error for invalid timezone', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'Invalid/Timezone',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Invalid timezone');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const createdUser = await userService.createUser(userData);

      // Then update it
      const updateData = {
        firstName: 'Jane',
        timezone: 'America/Los_Angeles',
      };

      const updatedUser = await userService.updateUser(createdUser.id, updateData);

      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.lastName).toBe('Doe'); // Should remain unchanged
      expect(updatedUser.timezone).toBe('America/Los_Angeles');
    });

    it('should throw error when user not found', async () => {
      const updateData = {
        firstName: 'Jane',
      };

      await expect(userService.updateUser('non-existent-id', updateData))
        .rejects.toThrow('not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-05-15',
        timezone: 'America/New_York',
      };

      const createdUser = await userService.createUser(userData);

      // Then delete it
      await userService.deleteUser(createdUser.id);

      // Verify it's deleted
      await expect(userService.getUserById(createdUser.id))
        .rejects.toThrow('not found');
    });
  });

  describe('getUsersWithBirthdayToday', () => {
    it('should return users with birthday today', async () => {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;

      // Create a user with birthday today
      const userData = {
        firstName: 'Birthday',
        lastName: 'User',
        birthDate: `1990-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        timezone: 'America/New_York',
      };

      await userService.createUser(userData);

      // Create a user with different birthday
      const otherUserData = {
        firstName: 'Other',
        lastName: 'User',
        birthDate: '1990-01-01',
        timezone: 'America/New_York',
      };

      await userService.createUser(otherUserData);

      const birthdayUsers = await userService.getUsersWithBirthdayToday();

      expect(birthdayUsers).toHaveLength(1);
      expect(birthdayUsers[0].firstName).toBe('Birthday');
    });
  });
});