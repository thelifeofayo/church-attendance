import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';
import { ApiResponse, AttendanceRecord, AttendanceRecordWithRelations, PaginatedResponse, ServiceType } from 'shared';
import { SubmitAttendanceInput, UpdateAttendanceInput, ListAttendanceQuery } from './attendance.schema';

export class AttendanceController {
  async list(
    req: Request<unknown, unknown, unknown, ListAttendanceQuery>,
    res: Response<PaginatedResponse<AttendanceRecordWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await attendanceService.listAttendanceRecords(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<AttendanceRecordWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const record = await attendanceService.getAttendanceById(req.params.id, req.user!);
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async submit(
    req: Request<{ id: string }, unknown, SubmitAttendanceInput>,
    res: Response<ApiResponse<AttendanceRecord>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const record = await attendanceService.submitAttendance(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateAttendanceInput>,
    res: Response<ApiResponse<AttendanceRecord>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const record = await attendanceService.updateAttendance(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendReminder(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await attendanceService.sendReminder(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerRecordCreation(
    req: Request<unknown, unknown, { serviceType: ServiceType }>,
    res: Response<ApiResponse<{ created: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { serviceType } = req.body;
      const created = await attendanceService.createRecordsForServiceDay(serviceType);
      res.json({
        success: true,
        data: { created },
        message: `Created ${created} attendance records for ${serviceType}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
