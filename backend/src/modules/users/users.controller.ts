import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ApiResponse, User, UserWithRelations, PaginatedResponse } from 'shared';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';

export class UsersController {
  async list(
    req: Request<unknown, unknown, unknown, ListUsersQuery>,
    res: Response<PaginatedResponse<User>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await usersService.listUsers(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<UserWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id, req.user!);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateUserInput>,
    res: Response<ApiResponse<User>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.createUser(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateUserInput>,
    res: Response<ApiResponse<User>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.updateUser(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await usersService.deactivateUser(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
