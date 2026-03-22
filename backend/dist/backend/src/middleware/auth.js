"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../utils/prisma");
const shared_1 = require("shared");
async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded) {
            throw new errors_1.UnauthorizedError('Invalid or expired token');
        }
        // Verify user still exists and is active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                resetToken: true,
                resetTokenExpiry: true,
                teamAsHead: {
                    select: { id: true },
                },
                teamAsSubHead: {
                    select: { id: true },
                },
                departmentAsHOD: {
                    select: { id: true, teamId: true },
                },
                departmentAsAssistantHOD: {
                    select: { id: true, teamId: true },
                },
            },
        });
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError('User not found or inactive');
        }
        const requiresPasswordChange = !!user.resetToken &&
            user.resetToken.startsWith('DEFAULT_') &&
            !!user.resetTokenExpiry &&
            user.resetTokenExpiry > new Date();
        // If user is using the onboarding/default password, block access to the system
        // until they change it.
        if (requiresPasswordChange) {
            const isAuthBase = req.baseUrl === '/api/auth';
            const allowedPaths = new Set(['/change-password', '/me', '/logout', '/password-change-status']);
            if (!(isAuthBase && allowedPaths.has(req.path))) {
                throw new errors_1.UnauthorizedError('Password change required');
            }
        }
        // Add team and department IDs based on role
        let teamId = null;
        let departmentId = null;
        if (user.role === shared_1.Role.TEAM_HEAD && user.teamAsHead) {
            teamId = user.teamAsHead.id;
        }
        else if (user.role === shared_1.Role.SUB_TEAM_HEAD && user.teamAsSubHead) {
            teamId = user.teamAsSubHead.id;
        }
        else if (user.role === shared_1.Role.HOD && user.departmentAsHOD) {
            departmentId = user.departmentAsHOD.id;
            teamId = user.departmentAsHOD.teamId;
        }
        else if (user.role === shared_1.Role.ASSISTANT_HOD && user.departmentAsAssistantHOD) {
            departmentId = user.departmentAsAssistantHOD.id;
            teamId = user.departmentAsAssistantHOD.teamId;
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: user.role,
            teamId,
            departmentId,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
// Optional authentication - doesn't throw if no token
async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    await authenticate(req, res, next);
}
//# sourceMappingURL=auth.js.map