import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { Role } from 'shared';

// Require specific roles
export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}

// Admin only
export function requireAdmin() {
  return requireRoles(Role.ADMIN);
}

// Admin or Team Head
export function requireAdminOrTeamHead() {
  return requireRoles(Role.ADMIN, Role.TEAM_HEAD);
}

// Team Head only
export function requireTeamHead() {
  return requireRoles(Role.TEAM_HEAD);
}

// HOD only
export function requireHOD() {
  return requireRoles(Role.HOD);
}

// Any authenticated user
export function requireAuthenticated() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    next();
  };
}

// Team scope verification - ensures Team Head can only access their own team
export function requireTeamScope() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // Admins can access all teams
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    // Team Heads can only access their own team
    if (req.user.role === Role.TEAM_HEAD) {
      const requestedTeamId = req.params.teamId || req.body?.teamId || req.query?.teamId;

      if (requestedTeamId && requestedTeamId !== req.user.teamId) {
        next(new ForbiddenError('Access denied to this team'));
        return;
      }
    }

    next();
  };
}

// Department scope verification - ensures HOD can only access their own department
export function requireDepartmentScope() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // Admins can access all departments
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    // HODs can only access their own department
    if (req.user.role === Role.HOD) {
      const requestedDeptId = req.params.departmentId || req.body?.departmentId || req.query?.departmentId;

      if (requestedDeptId && requestedDeptId !== req.user.departmentId) {
        next(new ForbiddenError('Access denied to this department'));
        return;
      }
    }

    next();
  };
}
