import axios from 'axios';
import { MessageService } from '../../src/services/MessageService';
import { User } from '../../src/entities/User';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MessageService', () => {
  let messageService: MessageService;
  let mockUser: User;

  beforeEach(() => {
    messageService = new MessageService();
    
    // Create a mock user
    mockUser = {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1990-05-15'),
      birthDay: 15,
      birthMonth: 5,
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date(),
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('sendBirthdayMessage', () => {
    it('should send message successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const result = await messageService.sendBirthdayMessage(mockUser);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: 'Hey, John Doe it\'s your birthday',
          user: expect.objectContaining({
            id: 'test-user-id',
            firstName: 'John',
            lastName: 'Doe',
          }),
        }),
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 500,
        data: { error: 'Server error' },
      });

      const result = await messageService.sendBirthdayMessage(mockUser);

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await messageService.sendBirthdayMessage(mockUser);

      expect(result).toBe(false);
    });
  });

  describe('sendBirthdayMessageWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          data: { success: true },
        });

      const result = await messageService.sendBirthdayMessageWithRetry(mockUser);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await messageService.sendBirthdayMessageWithRetry(mockUser);

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});