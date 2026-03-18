import { Request, Response, NextFunction } from 'express';
import { ApiResponse, Broadcast, BroadcastWithCreator, PaginatedResponse } from 'shared';
import { CreateBroadcastInput, ListBroadcastsQuery } from './broadcasts.schema';
export declare class BroadcastsController {
    list(req: Request<unknown, unknown, unknown, ListBroadcastsQuery>, res: Response<PaginatedResponse<BroadcastWithCreator>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateBroadcastInput>, res: Response<ApiResponse<Broadcast>>, next: NextFunction): Promise<void>;
    send(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<Broadcast>>, next: NextFunction): Promise<void>;
    delete(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const broadcastsController: BroadcastsController;
//# sourceMappingURL=broadcasts.controller.d.ts.map