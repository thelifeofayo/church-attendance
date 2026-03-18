import { Request, Response, NextFunction } from 'express';
import { ApiResponse, Member, MemberWithRelations, PaginatedResponse } from 'shared';
import { CreateMemberInput, UpdateMemberInput, ListMembersQuery } from './members.schema';
export declare class MembersController {
    list(req: Request<unknown, unknown, unknown, ListMembersQuery>, res: Response<PaginatedResponse<Member>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<MemberWithRelations>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateMemberInput>, res: Response<ApiResponse<Member>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateMemberInput>, res: Response<ApiResponse<Member>>, next: NextFunction): Promise<void>;
    deactivate(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    reactivate(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const membersController: MembersController;
//# sourceMappingURL=members.controller.d.ts.map