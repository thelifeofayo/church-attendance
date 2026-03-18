"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.generateDiff = generateDiff;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createAuditLog(params) {
    const { userId, userRole, action, entityType, entityId, diff } = params;
    await prisma.auditLog.create({
        data: {
            userId,
            userRole,
            action,
            entityType,
            entityId,
            diffJson: diff || null,
        },
    });
}
function generateDiff(oldData, newData) {
    const diff = {};
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
//# sourceMappingURL=auditLog.js.map