import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = plainToInstance(CreateUserDto, req.body);
      const errors = await validate(userData);

      if (errors.length > 0) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const user = await this.userService.createUser(userData);
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          timezone: user.timezone,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userData = plainToInstance(UpdateUserDto, req.body);
      const errors = await validate(userData);

      if (errors.length > 0) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const user = await this.userService.updateUser(id, userData);
      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          timezone: user.timezone,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'User ID is required',
        });
        return;
      }

      await this.userService.deleteUser(id);
      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      res.status(200).json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          timezone: user.timezone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      
      res.status(200).json({
        users: users.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          timezone: user.timezone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}