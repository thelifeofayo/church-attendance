"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
exports.requireAdmin = requireAdmin;
exports.requireAdminOrTeamHead = requireAdminOrTeamHead;
exports.requireTeamHead = requireTeamHead;
exports.requireSubTeamHead = requireSubTeamHead;
exports.requireHOD = requireHOD;
exports.requireAssistantHOD = requireAssistantHOD;
exports.requireHODOrAssistant = requireHODOrAssistant;
exports.requireAuthenticated = requireAuthenticated;
exports.requireTeamScope = requireTeamScope;
exports.requireDepartmentScope = requireDepartmentScope;
const errors_1 = require("../utils/errors");
const shared_1 = require("shared");
// Require specific roles
function requireRoles(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.UnauthorizedError('Authentication required'));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new errors_1.ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`));
            return;
        }
        next();
    };
}
// Admin only
function requireAdmin() {
    return requireRoles(shared_1.Role.ADMIN);
}
// Admin or Team Head or Sub-Team Head
function requireAdminOrTeamHead() {
    return requireRoles(shared_1.Role.ADMIN, shared_1.Role.TEAM_HEAD, shared_1.Role.SUB_TEAM_HEAD);
}
// Team Head only
function requireTeamHead() {
    return requireRoles(shared_1.Role.TEAM_HEAD);
}
// Sub-Team Head only
function requireSubTeamHead() {
    return requireRoles(shared_1.Role.SUB_TEAM_HEAD);
}
// HOD only
function requireHOD() {
    return requireRoles(shared_1.Role.HOD);
}
// Assistant HOD only
function requireAssistantHOD() {
    return requireRoles(shared_1.Role.ASSISTANT_HOD);
}
// HOD or Assistant HOD
function requireHODOrAssistant() {
    return requireRoles(shared_1.Role.HOD, shared_1.Role.ASSISTANT_HOD);
}
// Any authenticated user
function requireAuthenticated() {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.UnauthorizedError('Authentication required'));
            return;
        }
        next();
    };
}
// Team scope verification - ensures Team Head and Sub-Team Head can only access their own team
function requireTeamScope() {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.UnauthorizedError('Authentication required'));
            return;
        }
        // Admins can access all teams
        if (req.user.role === shared_1.Role.ADMIN) {
            next();
            return;
        }
        // Team Heads and Sub-Team Heads can only access their own team
        if (req.user.role === shared_1.Role.TEAM_HEAD || req.user.role === shared_1.Role.SUB_TEAM_HEAD) {
            const requestedTeamId = req.params.teamId || req.body?.teamId || req.query?.teamId;
            if (requestedTeamId && requestedTeamId !== req.user.teamId) {
                next(new errors_1.ForbiddenError('Access denied to this team'));
                return;
            }
        }
        next();
    };
}
// Department scope verification - ensures HOD and Assistant HOD can only access their own department
function requireDepartmentScope() {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.UnauthorizedError('Authentication required'));
            return;
        }
        // Admins can access all departments
        if (req.user.role === shared_1.Role.ADMIN) {
            next();
            return;
        }
        // HODs and Assistant HODs can only access their own department
        if (req.user.role === shared_1.Role.HOD || req.user.role === shared_1.Role.ASSISTANT_HOD) {
            const requestedDeptId = req.params.departmentId || req.body?.departmentId || req.query?.departmentId;
            if (requestedDeptId && requestedDeptId !== req.user.departmentId) {
                next(new errors_1.ForbiddenError('Access denied to this department'));
                return;
            }
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map