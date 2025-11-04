import moment from 'moment-timezone';
import { BirthdaySchedulerService } from '../../src/services/BirthdaySchedulerService';
import { UserService } from '../../src/services/UserService';
import { MessageService } from '../../src/services/MessageService';

// Mock the services
jest.mock('../../src/services/UserService');
jest.mock('../../src/services/MessageService');
jest.mock('node-cron');

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;
const MockedMessageService = MessageService as jest.MockedClass<typeof MessageService>;

describe('BirthdaySchedulerService', () => {
  let birthdayScheduler: BirthdaySchedulerService;
  let mockUserService: jest.Mocked<UserService>;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserService = new MockedUserService() as jest.Mocked<UserService>;
    mockMessageService = new MockedMessageService() as jest.Mocked<MessageService>;
    
    birthdayScheduler = new BirthdaySchedulerService();
    // Replace the services with our mocks
    (birthdayScheduler as any).userService = mockUserService;
    (birthdayScheduler as any).messageService = mockMessageService;
  });

  describe('checkAndSendBirthdayMessages', () => {
    it('should send birthday messages to users at 9am their local time', async () => {
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
        fullName: 'John Doe',
      };

      const mockMessage = {
        id: 'message-1',
        userId: 'user-1',
        messageDate: new Date(),
        status: 'pending' as const,
      };

      // Mock it's 9am in New York
      const nyTime = moment().tz('America/New_York').hour(9).minute(0);
      jest.spyOn(moment, 'tz').mockReturnValue(nyTime as any);

      mockUserService.getUsersWithBirthdayToday.mockResolvedValue([mockUser as any]);
      mockUserService.createBirthdayMessage.mockResolvedValue(mockMessage as any);
      mockMessageService.sendBirthdayMessageWithRetry.mockResolvedValue(true);

      await birthdayScheduler.checkAndSendBirthdayMessages();

      expect(mockUserService.getUsersWithBirthdayToday).toHaveBeenCalled();
      expect(mockUserService.createBirthdayMessage).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date)
      );
      expect(mockMessageService.sendBirthdayMessageWithRetry).toHaveBeenCalledWith(mockUser);
      expect(mockUserService.markMessageAsSent).toHaveBeenCalledWith('message-1');
    });

    it('should not send message if not 9am in user timezone', async () => {
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
        fullName: 'John Doe',
      };

      // Mock it's 8am in New York (not 9am)
      const nyTime = moment().tz('America/New_York').hour(8).minute(0);
      jest.spyOn(moment, 'tz').mockReturnValue(nyTime as any);

      mockUserService.getUsersWithBirthdayToday.mockResolvedValue([mockUser as any]);

      await birthdayScheduler.checkAndSendBirthdayMessages();

      expect(mockUserService.createBirthdayMessage).not.toHaveBeenCalled();
      expect(mockMessageService.sendBirthdayMessageWithRetry).not.toHaveBeenCalled();
    });

    it('should handle different timezones correctly', async () => {
      const users = [
        {
          id: 'user-ny',
          firstName: 'John',
          lastName: 'NY',
          timezone: 'America/New_York',
          fullName: 'John NY',
        },
        {
          id: 'user-la',
          firstName: 'Jane',
          lastName: 'LA',
          timezone: 'America/Los_Angeles',
          fullName: 'Jane LA',
        },
      ];

      const mockMessage = {
        id: 'message-1',
        userId: 'user-ny',
        messageDate: new Date(),
        status: 'pending' as const,
      };

      // Mock times: 9am in NY, 6am in LA
      jest.spyOn(moment.prototype, 'tz').mockImplementation((timezone: unknown) => {
        if (timezone === 'America/New_York') {
          return moment().hour(9).minute(0) as any;
        } else if (timezone === 'America/Los_Angeles') {
          return moment().hour(6).minute(0) as any;
        }
        return moment() as any;
      });

      mockUserService.getUsersWithBirthdayToday.mockResolvedValue(users as any);
      mockUserService.createBirthdayMessage.mockResolvedValue(mockMessage as any);
      mockMessageService.sendBirthdayMessageWithRetry.mockResolvedValue(true);

      await birthdayScheduler.checkAndSendBirthdayMessages();

      // Should only send to NY user (9am) but not LA user (6am)
      expect(mockMessageService.sendBirthdayMessageWithRetry).toHaveBeenCalledTimes(1);
      expect(mockMessageService.sendBirthdayMessageWithRetry).toHaveBeenCalledWith(users[0]);
    });
  });

  describe('recoverMissedMessages', () => {
    it('should recover missed birthday messages', async () => {
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        birthDay: 15,
        birthMonth: 5,
        timezone: 'America/New_York',
        fullName: 'John Doe',
      };

      const mockMessage = {
        id: 'message-1',
        userId: 'user-1',
        messageDate: new Date(),
        status: 'pending' as const,
      };

      // Mock today is user's birthday
      const today = moment().date(15).month(4); // May 15th (0-indexed month)
      jest.spyOn(moment.prototype, 'subtract').mockReturnValue(today as any);
      jest.spyOn(moment.prototype, 'tz').mockReturnValue(today as any);

      mockUserService.getAllUsers.mockResolvedValue([mockUser as any]);
      mockUserService.createBirthdayMessage.mockResolvedValue(mockMessage as any);
      mockMessageService.sendBirthdayMessageWithRetry.mockResolvedValue(true);

      await birthdayScheduler.recoverMissedMessages();

      expect(mockUserService.getAllUsers).toHaveBeenCalled();
      expect(mockMessageService.sendBirthdayMessageWithRetry).toHaveBeenCalledWith(mockUser);
      expect(mockUserService.markMessageAsSent).toHaveBeenCalledWith('message-1');
    });
  });
});