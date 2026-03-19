import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../utils/prisma';
import { Role } from 'shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & {
        teamId?: string | null;
        departmentId?: string | null;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
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
        departmentAsHOD: {
          select: { id: true, teamId: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const requiresPasswordChange =
      !!user.resetToken &&
      user.resetToken.startsWith('DEFAULT_') &&
      !!user.resetTokenExpiry &&
      user.resetTokenExpiry > new Date();

    // If user is using the onboarding/default password, block access to the system
    // until they change it.
    if (requiresPasswordChange) {
      const isAuthBase = req.baseUrl === '/api/auth';
      const allowedPaths = new Set(['/change-password', '/me', '/logout']);
      if (!(isAuthBase && allowedPaths.has(req.path))) {
        throw new UnauthorizedError('Password change required');
      }
    }

    // Add team and department IDs based on role
    let teamId: string | null = null;
    let departmentId: string | null = null;

    if (user.role === Role.TEAM_HEAD && user.teamAsHead) {
      teamId = user.teamAsHead.id;
    } else if (user.role === Role.HOD && user.departmentAsHOD) {
      departmentId = user.departmentAsHOD.id;
      teamId = user.departmentAsHOD.teamId;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: user.role as Role,
      teamId,
      departmentId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Optional authentication - doesn't throw if no token
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  await authenticate(req, res, next);
}
