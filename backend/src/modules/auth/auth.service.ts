import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../utils/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { emailService } from '../../utils/email';
import { config } from '../../config';
import { createAuditLog } from '../../utils/auditLog';
import { logger } from '../../utils/logger';
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
        teamAsSubHead: { select: { id: true } },
        departmentAsHOD: { select: { id: true, teamId: true } },
        departmentAsAssistantHOD: { select: { id: true, teamId: true } },
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

    const requiresPasswordChange =
      !!user.resetToken &&
      user.resetToken.startsWith('DEFAULT_') &&
      !!user.resetTokenExpiry &&
      user.resetTokenExpiry > new Date();

    // Determine team and department IDs based on role
    let teamId: string | null = null;
    let departmentId: string | null = null;

    if (user.role === Role.TEAM_HEAD && user.teamAsHead) {
      teamId = user.teamAsHead.id;
    } else if (user.role === Role.SUB_TEAM_HEAD && user.teamAsSubHead) {
      teamId = user.teamAsSubHead.id;
    } else if (user.role === Role.HOD && user.departmentAsHOD) {
      departmentId = user.departmentAsHOD.id;
      teamId = user.departmentAsHOD.teamId;
    } else if (user.role === Role.ASSISTANT_HOD && user.departmentAsAssistantHOD) {
      departmentId = user.departmentAsAssistantHOD.id;
      teamId = user.departmentAsAssistantHOD.teamId;
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

    // Record login event in audit log.
    // Intentionally NOT returned to the frontend (Users page won't render this).
    try {
      await createAuditLog({
        userId: user.id,
        userRole: user.role as Role,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        diff: {
          lastLoginAt: {
            old: null,
            new: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      // Login must not fail if audit logging fails.
      logger.error(`Failed to create lastLogin audit log: ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
      user: userResponse,
      accessToken,
      refreshToken,
      requiresPasswordChange,
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
            teamAsSubHead: { select: { id: true } },
            departmentAsHOD: { select: { id: true, teamId: true } },
            departmentAsAssistantHOD: { select: { id: true, teamId: true } },
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
    } else if (user.role === Role.SUB_TEAM_HEAD && user.teamAsSubHead) {
      teamId = user.teamAsSubHead.id;
    } else if (user.role === Role.HOD && user.departmentAsHOD) {
      departmentId = user.departmentAsHOD.id;
      teamId = user.departmentAsHOD.teamId;
    } else if (user.role === Role.ASSISTANT_HOD && user.departmentAsAssistantHOD) {
      departmentId = user.departmentAsAssistantHOD.id;
      teamId = user.departmentAsAssistantHOD.teamId;
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

  async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<{ resetToken?: string; resetUrl?: string }> {
    const { email } = input;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        resetToken: true,
      },
    });

    // If this is an onboarding user (default password), preserve the DEFAULT_ marker
    // so the "requiresPasswordChange" gate still applies.
    const isOnboardingDefaultPassword = user?.resetToken?.startsWith('DEFAULT_');
    const resetToken = isOnboardingDefaultPassword ? `DEFAULT_${uuidv4()}` : uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (user && user.isActive) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });
    }

    const resetUrl = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Token delivery mode (no email).
    if (config.passwordReset.delivery === 'token' || !emailService.isConfigured()) {
      // For local development, it can be helpful to still know the token.
      if (config.nodeEnv !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`Password reset token for ${email}: ${resetToken}`);
      }
      return { resetToken, resetUrl };
    }

    // Email delivery mode: only attempt sending if the user exists and is active.
    if (user && user.isActive) {
      const subject = 'Password reset request';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Hello ${user.firstName},</p>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour. If you didn’t request this, you can ignore this email.</p>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html,
        recipientName: `${user.firstName} ${user.lastName}`,
      });
    }

    return {};
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
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all refresh tokens (force re-login / re-auth)
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

  async getPasswordChangeStatus(userId: string): Promise<{ requiresPasswordChange: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        resetToken: true,
        resetTokenExpiry: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return { requiresPasswordChange: false };
    }

    const requiresPasswordChange =
      !!user.resetToken &&
      user.resetToken.startsWith('DEFAULT_') &&
      !!user.resetTokenExpiry &&
      user.resetTokenExpiry > new Date();

    return { requiresPasswordChange };
  }
}

export const authService = new AuthService();
