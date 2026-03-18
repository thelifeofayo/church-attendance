import { Role } from '@prisma/client';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'OVERRIDE';
export type EntityType = 'User' | 'Team' | 'Department' | 'Member' | 'AttendanceRecord' | 'ServiceConfig';
interface AuditLogParams {
    userId: string;
    userRole: Role;
    action: AuditAction;
    entityType: EntityType;
    entityId: string;
    diff?: Record<string, unknown>;
}
export declare function createAuditLog(params: AuditLogParams): Promise<void>;
export declare function generateDiff(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, {
    old: unknown;
    new: unknown;
}>;
export {};
//# sourceMappingURL=auditLog.d.ts.map