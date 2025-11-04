import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, BirthdayMessage } from '../entities/User';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import moment from 'moment-timezone';

export class UserService {
  private userRepository: Repository<User>;
  private messageRepository: Repository<BirthdayMessage>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.messageRepository = AppDataSource.getRepository(BirthdayMessage);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const birthDate = new Date(userData.birthDate);
    
    // Validate timezone
    if (!moment.tz.zone(userData.timezone)) {
      throw new Error(`Invalid timezone: ${userData.timezone}`);
    }

    const user = this.userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      birthDate,
      birthDay: birthDate.getDate(),
      birthMonth: birthDate.getMonth() + 1, // 1-indexed
      timezone: userData.timezone,
    });

    return await this.userRepository.save(user);
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);
    
    if (userData.firstName) user.firstName = userData.firstName;
    if (userData.lastName) user.lastName = userData.lastName;
    if (userData.timezone) {
      if (!moment.tz.zone(userData.timezone)) {
        throw new Error(`Invalid timezone: ${userData.timezone}`);
      }
      user.timezone = userData.timezone;
    }
    
    if (userData.birthDate) {
      const birthDate = new Date(userData.birthDate);
      user.birthDate = birthDate;
      user.birthDay = birthDate.getDate();
      user.birthMonth = birthDate.getMonth() + 1;
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.userRepository.remove(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async getUsersWithBirthdayToday(): Promise<User[]> {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    return await this.userRepository.find({
      where: {
        birthDay: day,
        birthMonth: month,
      },
    });
  }

  async createBirthdayMessage(userId: string, messageDate: Date): Promise<BirthdayMessage> {
    // Check if message already exists for this user and date
    const existing = await this.messageRepository.findOne({
      where: {
        userId,
        messageDate,
      },
    });

    if (existing) {
      return existing;
    }

    const message = this.messageRepository.create({
      userId,
      messageDate,
      status: 'pending',
    });

    return await this.messageRepository.save(message);
  }

  async markMessageAsSent(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, {
      status: 'sent',
      sentAt: new Date(),
    });
  }

  async markMessageAsFailed(messageId: string, error: string): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (message) {
      await this.messageRepository.update(messageId, {
        status: 'failed',
        retryCount: message.retryCount + 1,
        errorMessage: error,
      });
    }
  }

  async getPendingMessages(): Promise<BirthdayMessage[]> {
    return await this.messageRepository.find({
      where: {
        status: 'pending',
      },
    });
  }

  async getFailedMessages(): Promise<BirthdayMessage[]> {
    return await this.messageRepository.find({
      where: {
        status: 'failed',
      },
    });
  }
}