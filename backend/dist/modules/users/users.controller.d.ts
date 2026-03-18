import { Request, Response, NextFunction } from 'express';
import { ApiResponse, User, UserWithRelations, PaginatedResponse } from 'shared';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';
export declare class UsersController {
    list(req: Request<unknown, unknown, unknown, ListUsersQuery>, res: Response<PaginatedResponse<User>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<UserWithRelations>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateUserInput>, res: Response<ApiResponse<User>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateUserInput>, res: Response<ApiResponse<User>>, next: NextFunction): Promise<void>;
    deactivate(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const usersController: UsersController;
//# sourceMappingURL=users.controller.d.ts.map