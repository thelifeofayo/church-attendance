import { WeeklyReportQuery, ExportReportQuery } from './reports.schema';
interface WeeklyReportData {
    weekStart: string;
    weekEnd: string;
    generatedAt: string;
    summary: {
        wednesday: ServiceSummary | null;
        sunday: ServiceSummary | null;
    };
    teams: TeamReportData[];
}
interface ServiceSummary {
    serviceDate: string;
    totalExpected: number;
    totalPresent: number;
    attendancePercentage: number;
    submittedCount: number;
    totalDepartments: number;
}
interface TeamReportData {
    teamName: string;
    teamHeadName: string | null;
    departments: DepartmentReportData[];
    totals: {
        wednesday: {
            expected: number;
            present: number;
            percentage: number;
        } | null;
        sunday: {
            expected: number;
            present: number;
            percentage: number;
        } | null;
    };
}
interface DepartmentReportData {
    departmentName: string;
    hodName: string | null;
    memberCount: number;
    wednesday: AttendanceDetail | null;
    sunday: AttendanceDetail | null;
}
interface AttendanceDetail {
    status: string;
    present: number;
    absent: number;
    percentage: number;
    absentMembers?: {
        name: string;
        reason: string | null;
    }[];
}
export declare class ReportsService {
    private getWeekBounds;
    getWeeklyReport(query: WeeklyReportQuery): Promise<WeeklyReportData>;
    generatePDF(query: ExportReportQuery): Promise<Buffer>;
    generateCSV(query: ExportReportQuery): Promise<string>;
}
export declare const reportsService: ReportsService;
export {};
//# sourceMappingURL=reports.service.d.ts.map