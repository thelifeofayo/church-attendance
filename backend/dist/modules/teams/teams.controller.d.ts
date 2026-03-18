import { Request, Response, NextFunction } from 'express';
import { ApiResponse, Team, TeamWithRelations, PaginatedResponse } from 'shared';
import { CreateTeamInput, UpdateTeamInput, ListTeamsQuery } from './teams.schema';
export declare class TeamsController {
    list(req: Request<unknown, unknown, unknown, ListTeamsQuery>, res: Response<PaginatedResponse<TeamWithRelations>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<TeamWithRelations>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateTeamInput>, res: Response<ApiResponse<Team>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateTeamInput>, res: Response<ApiResponse<Team>>, next: NextFunction): Promise<void>;
    deactivate(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const teamsController: TeamsController;
//# sourceMappingURL=teams.controller.d.ts.map