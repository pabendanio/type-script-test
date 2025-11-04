import cron from 'node-cron';
import moment from 'moment-timezone';
import { UserService } from './UserService';
import { MessageService } from './MessageService';

export class BirthdaySchedulerService {
  private userService: UserService;
  private messageService: MessageService;
  private isRunning: boolean = false;

  constructor() {
    this.userService = new UserService();
    this.messageService = new MessageService();
  }

  start(): void {
    console.log('Starting birthday scheduler...');
    
    // Run every minute to check for birthdays
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        console.log('Previous birthday check still running, skipping...');
        return;
      }
      
      this.isRunning = true;
      try {
        await this.checkAndSendBirthdayMessages();
      } catch (error) {
        console.error('Error in birthday scheduler:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('Birthday scheduler started successfully');
  }

  async checkAndSendBirthdayMessages(): Promise<void> {
    try {
      const users = await this.userService.getUsersWithBirthdayToday();
      
      for (const user of users) {
        await this.processBirthdayForUser(user);
      }
      
      // Also process any failed messages for retry
      await this.processFailedMessages();
    } catch (error) {
      console.error('Error checking birthday messages:', error);
    }
  }

  private async processBirthdayForUser(user: any): Promise<void> {
    try {
      // Get current time in user's timezone
      const userTime = moment().tz(user.timezone);
      const currentHour = userTime.hour();
      
      // Check if it's 9:00 AM in user's timezone (9:00 to 9:59)
      if (currentHour !== 9) {
        return;
      }
      
      const today = userTime.format('YYYY-MM-DD');
      const messageDate = new Date(today);
      
      // Create or get existing message record
      const birthdayMessage = await this.userService.createBirthdayMessage(user.id, messageDate);
      
      // Skip if already sent
      if (birthdayMessage.status === 'sent') {
        return;
      }
      
      console.log(`Sending birthday message to ${user.fullName} at ${userTime.format('YYYY-MM-DD HH:mm:ss')} (${user.timezone})`);
      
      // Send the message
      const success = await this.messageService.sendBirthdayMessageWithRetry(user);
      
      if (success) {
        await this.userService.markMessageAsSent(birthdayMessage.id);
        console.log(`✅ Birthday message sent successfully to ${user.fullName}`);
      } else {
        await this.userService.markMessageAsFailed(birthdayMessage.id, 'Failed to send after retries');
        console.error(`❌ Failed to send birthday message to ${user.fullName}`);
      }
    } catch (error) {
      console.error(`Error processing birthday for user ${user.fullName}:`, error);
    }
  }

  private async processFailedMessages(): Promise<void> {
    try {
      const failedMessages = await this.userService.getFailedMessages();
      
      for (const message of failedMessages) {
        // Only retry if retry count is less than max and message is not too old
        if (message.retryCount < 5 && this.isMessageRecentEnough(message.messageDate)) {
          const user = await this.userService.getUserById(message.userId);
          console.log(`Retrying failed message for ${user.fullName}`);
          
          const success = await this.messageService.sendBirthdayMessageWithRetry(user);
          
          if (success) {
            await this.userService.markMessageAsSent(message.id);
            console.log(`✅ Retry successful for ${user.fullName}`);
          } else {
            await this.userService.markMessageAsFailed(message.id, 'Retry failed');
          }
        }
      }
    } catch (error) {
      console.error('Error processing failed messages:', error);
    }
  }

  private isMessageRecentEnough(messageDate: Date): boolean {
    const daysDiff = moment().diff(moment(messageDate), 'days');
    return daysDiff <= 1; // Only retry messages from today or yesterday
  }

  async recoverMissedMessages(): Promise<void> {
    console.log('Checking for missed birthday messages...');
    
    try {
      // Get all users
      const users = await this.userService.getAllUsers();
      
      for (const user of users) {
        await this.checkMissedBirthdaysForUser(user);
      }
    } catch (error) {
      console.error('Error recovering missed messages:', error);
    }
  }

  private async checkMissedBirthdaysForUser(user: any): Promise<void> {
    try {
      // Check last 7 days for missed birthdays
      for (let i = 0; i < 7; i++) {
        const checkDate = moment().subtract(i, 'days');
        const userTime = moment(checkDate).tz(user.timezone);
        
        // Check if it was user's birthday on this date
        if (userTime.date() === user.birthDay && (userTime.month() + 1) === user.birthMonth) {
          const dateStr = userTime.format('YYYY-MM-DD');
          const messageDate = new Date(dateStr);
          
          // Check if we have a sent message for this date
          const birthdayMessage = await this.userService.createBirthdayMessage(user.id, messageDate);
          
          if (birthdayMessage.status === 'pending') {
            console.log(`Found missed birthday for ${user.fullName} on ${dateStr}`);
            
            const success = await this.messageService.sendBirthdayMessageWithRetry(user);
            
            if (success) {
              await this.userService.markMessageAsSent(birthdayMessage.id);
              console.log(`✅ Recovered missed birthday message for ${user.fullName}`);
            } else {
              await this.userService.markMessageAsFailed(birthdayMessage.id, 'Recovery attempt failed');
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking missed birthdays for user ${user.fullName}:`, error);
    }
  }
}