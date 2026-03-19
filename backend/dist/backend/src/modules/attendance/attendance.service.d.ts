import { ServiceType, AttendanceRecord, AttendanceRecordWithRelations, PaginatedResponse } from 'shared';
import { SubmitAttendanceInput, UpdateAttendanceInput, ListAttendanceQuery } from './attendance.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class AttendanceService {
    listAttendanceRecords(query: ListAttendanceQuery, currentUser: TokenPayload): Promise<PaginatedResponse<AttendanceRecordWithRelations>>;
    getAttendanceById(id: string, currentUser: TokenPayload): Promise<AttendanceRecordWithRelations>;
    submitAttendance(id: string, input: SubmitAttendanceInput, currentUser: TokenPayload): Promise<AttendanceRecord>;
    updateAttendance(id: string, input: UpdateAttendanceInput, currentUser: TokenPayload): Promise<AttendanceRecord>;
    createAttendanceRecord(departmentId: string, serviceDate: Date, serviceType: ServiceType): Promise<AttendanceRecord>;
    createRecordsForServiceDay(serviceType: ServiceType, serviceDate?: Date): Promise<number>;
    sendReminder(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const attendanceService: AttendanceService;
//# sourceMappingURL=attendance.service.d.ts.map