import { Request, Response, NextFunction } from 'express';
import { ApiResponse, Department, DepartmentWithRelations, PaginatedResponse } from 'shared';
import { CreateDepartmentInput, UpdateDepartmentInput, AssignHODInput, ListDepartmentsQuery } from './departments.schema';
export declare class DepartmentsController {
    list(req: Request<unknown, unknown, unknown, ListDepartmentsQuery>, res: Response<PaginatedResponse<DepartmentWithRelations>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<DepartmentWithRelations>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateDepartmentInput>, res: Response<ApiResponse<Department>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateDepartmentInput>, res: Response<ApiResponse<Department>>, next: NextFunction): Promise<void>;
    assignHOD(req: Request<{
        id: string;
    }, unknown, AssignHODInput>, res: Response<ApiResponse<Department>>, next: NextFunction): Promise<void>;
    deactivate(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const departmentsController: DepartmentsController;
//# sourceMappingURL=departments.controller.d.ts.map