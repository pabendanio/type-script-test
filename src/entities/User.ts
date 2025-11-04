import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index(['birthDay', 'birthMonth']) // Optimize birthday queries
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: Date;

  @Column({ name: 'birth_day', type: 'int' })
  birthDay!: number;

  @Column({ name: 'birth_month', type: 'int' })
  birthMonth!: number;

  @Column({ name: 'timezone', length: 100 })
  timezone!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

@Entity('birthday_messages')
@Index(['userId', 'messageDate'], { unique: true }) // Prevent duplicate messages
export class BirthdayMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'message_date', type: 'date' })
  messageDate!: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}