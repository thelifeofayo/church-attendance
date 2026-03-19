import { User, UserWithRelations, PaginatedResponse } from 'shared';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class UsersService {
    listUsers(query: ListUsersQuery, currentUser: TokenPayload): Promise<PaginatedResponse<User>>;
    getUserById(id: string, currentUser: TokenPayload): Promise<UserWithRelations>;
    createUser(input: CreateUserInput, currentUser: TokenPayload): Promise<User & {
        temporaryPassword: string;
    }>;
    updateUser(id: string, input: UpdateUserInput, currentUser: TokenPayload): Promise<User>;
    deactivateUser(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const usersService: UsersService;
//# sourceMappingURL=users.service.d.ts.map