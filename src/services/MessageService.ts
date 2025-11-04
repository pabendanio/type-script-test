import axios from 'axios';
import { User } from '../entities/User';

export class MessageService {
  private webhookUrl: string;
  private maxRetries: number;

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || 'https://hookbin.com/your-endpoint';
    this.maxRetries = parseInt(process.env.MAX_RETRIES || '3');
  }

  async sendBirthdayMessage(user: User): Promise<boolean> {
    const message = `Hey, ${user.fullName} it's your birthday`;
    
    try {
      const response = await axios.post(this.webhookUrl, {
        message,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          timezone: user.timezone,
        },
        timestamp: new Date().toISOString(),
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status >= 200 && response.status < 300) {
        console.log(`Birthday message sent successfully to ${user.fullName}`);
        return true;
      } else {
        console.error(`Failed to send birthday message to ${user.fullName}: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`Error sending birthday message to ${user.fullName}:`, error);
      return false;
    }
  }

  async sendBirthdayMessageWithRetry(user: User, retryCount = 0): Promise<boolean> {
    const success = await this.sendBirthdayMessage(user);
    
    if (!success && retryCount < this.maxRetries) {
      console.log(`Retrying message for ${user.fullName}, attempt ${retryCount + 1}`);
      await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
      return await this.sendBirthdayMessageWithRetry(user, retryCount + 1);
    }
    
    return success;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}