import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../utils/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  TokenPayload,
} from '../../utils/jwt';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../../utils/errors';
import { Role, LoginResponse, User } from 'shared';
import {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schema';

export class AuthService {
  async login(input: LoginInput): Promise<LoginResponse> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        teamAsHead: { select: { id: true } },
        departmentAsHOD: { select: { id: true, teamId: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Determine team and department IDs based on role
    let teamId: string | null = null;
    let departmentId: string | null = null;

    if (user.role === Role.TEAM_HEAD && user.teamAsHead) {
      teamId = user.teamAsHead.id;
    } else if (user.role === Role.HOD && user.departmentAsHOD) {
      departmentId = user.departmentAsHOD.id;
      teamId = user.departmentAsHOD.teamId;
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      teamId,
      departmentId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Clean up expired refresh tokens
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(input: RefreshTokenInput): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = input;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            teamAsHead: { select: { id: true } },
            departmentAsHOD: { select: { id: true, teamId: true } },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token has expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const { user } = storedToken;

    // Determine team and department IDs
    let teamId: string | null = null;
    let departmentId: string | null = null;

    if (user.role === Role.TEAM_HEAD && user.teamAsHead) {
      teamId = user.teamAsHead.id;
    } else if (user.role === Role.HOD && user.departmentAsHOD) {
      departmentId = user.departmentAsHOD.id;
      teamId = user.departmentAsHOD.teamId;
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      teamId,
      departmentId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken();

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const { email } = input;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return;
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link
    // For now, log the token (remove in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const { token, password } = input;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = input;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
