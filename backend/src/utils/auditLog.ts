import { PrismaClient, Prisma, Role } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { userId, userRole, action, entityType, entityId, diff } = params;

  await prisma.auditLog.create({
    data: {
      userId,
      userRole,
      action,
      entityType,
      entityId,
      diffJson: diff ? (diff as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });
}

export function generateDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    // Skip system fields
    if (['createdAt', 'updatedAt', 'passwordHash'].includes(key)) {
      continue;
    }

    const oldValue = oldData[key];
    const newValue = newData[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff[key] = { old: oldValue, new: newValue };
    }
  }

  return diff;
}
