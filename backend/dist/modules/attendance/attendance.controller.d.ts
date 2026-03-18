import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AttendanceRecord, AttendanceRecordWithRelations, PaginatedResponse, ServiceType } from 'shared';
import { SubmitAttendanceInput, UpdateAttendanceInput, ListAttendanceQuery } from './attendance.schema';
export declare class AttendanceController {
    list(req: Request<unknown, unknown, unknown, ListAttendanceQuery>, res: Response<PaginatedResponse<AttendanceRecordWithRelations>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<AttendanceRecordWithRelations>>, next: NextFunction): Promise<void>;
    submit(req: Request<{
        id: string;
    }, unknown, SubmitAttendanceInput>, res: Response<ApiResponse<AttendanceRecord>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateAttendanceInput>, res: Response<ApiResponse<AttendanceRecord>>, next: NextFunction): Promise<void>;
    sendReminder(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    triggerRecordCreation(req: Request<unknown, unknown, {
        serviceType: ServiceType;
    }>, res: Response<ApiResponse<{
        created: number;
    }>>, next: NextFunction): Promise<void>;
}
export declare const attendanceController: AttendanceController;
//# sourceMappingURL=attendance.controller.d.ts.map