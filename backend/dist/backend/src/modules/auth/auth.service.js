"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = require("../../utils/prisma");
const password_1 = require("../../utils/password");
const email_1 = require("../../utils/email");
const config_1 = require("../../config");
const auditLog_1 = require("../../utils/auditLog");
const logger_1 = require("../../utils/logger");
const jwt_1 = require("../../utils/jwt");
const errors_1 = require("../../utils/errors");
const shared_1 = require("shared");
class AuthService {
    async login(input) {
        const { email, password } = input;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                teamAsHead: { select: { id: true } },
                teamAsSubHead: { select: { id: true } },
                departmentAsHOD: { select: { id: true, teamId: true } },
                departmentAsAssistantHOD: { select: { id: true, teamId: true } },
            },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (!user.isActive) {
            throw new errors_1.UnauthorizedError('Account is deactivated');
        }
        const isValidPassword = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isValidPassword) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const requiresPasswordChange = !!user.resetToken &&
            user.resetToken.startsWith('DEFAULT_') &&
            !!user.resetTokenExpiry &&
            user.resetTokenExpiry > new Date();
        // Determine team and department IDs based on role
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
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            teamId,
            departmentId,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)();
        // Store refresh token
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: (0, jwt_1.getRefreshTokenExpiry)(),
            },
        });
        // Clean up expired refresh tokens
        await prisma_1.prisma.refreshToken.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { lt: new Date() },
            },
        });
        const userResponse = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
        // Record login event in audit log.
        // Intentionally NOT returned to the frontend (Users page won't render this).
        try {
            await (0, auditLog_1.createAuditLog)({
                userId: user.id,
                userRole: user.role,
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
        }
        catch (err) {
            // Login must not fail if audit logging fails.
            logger_1.logger.error(`Failed to create lastLogin audit log: ${err instanceof Error ? err.message : String(err)}`);
        }
        return {
            user: userResponse,
            accessToken,
            refreshToken,
            requiresPasswordChange,
        };
    }
    async refreshToken(input) {
        const { refreshToken } = input;
        const storedToken = await prisma_1.prisma.refreshToken.findUnique({
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
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        if (storedToken.expiresAt < new Date()) {
            await prisma_1.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new errors_1.UnauthorizedError('Refresh token has expired');
        }
        if (!storedToken.user.isActive) {
            throw new errors_1.UnauthorizedError('Account is deactivated');
        }
        const { user } = storedToken;
        // Determine team and department IDs
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
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            teamId,
            departmentId,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)();
        // Rotate refresh token
        await prisma_1.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                token: newRefreshToken,
                expiresAt: (0, jwt_1.getRefreshTokenExpiry)(),
            },
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(refreshToken) {
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async logoutAll(userId) {
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async forgotPassword(input) {
        const { email } = input;
        const user = await prisma_1.prisma.user.findUnique({
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
        const resetToken = isOnboardingDefaultPassword ? `DEFAULT_${(0, uuid_1.v4)()}` : (0, uuid_1.v4)();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        if (user && user.isActive) {
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry,
                },
            });
        }
        const resetUrl = `${config_1.config.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
        // Token delivery mode (no email).
        if (config_1.config.passwordReset.delivery === 'token' || !email_1.emailService.isConfigured()) {
            // For local development, it can be helpful to still know the token.
            if (config_1.config.nodeEnv !== 'production') {
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
            await email_1.emailService.sendEmail({
                to: user.email,
                subject,
                html,
                recipientName: `${user.firstName} ${user.lastName}`,
            });
        }
        return {};
    }
    async resetPassword(input) {
        const { token, password } = input;
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            throw new errors_1.BadRequestError('Invalid or expired reset token');
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        // Invalidate all refresh tokens
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
    }
    async changePassword(userId, input) {
        const { currentPassword, newPassword } = input;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        const isValidPassword = await (0, password_1.comparePassword)(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new errors_1.BadRequestError('Current password is incorrect');
        }
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        // Invalidate all refresh tokens (force re-login / re-auth)
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async getCurrentUser(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    async getPasswordChangeStatus(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
        const requiresPasswordChange = !!user.resetToken &&
            user.resetToken.startsWith('DEFAULT_') &&
            !!user.resetTokenExpiry &&
            user.resetTokenExpiry > new Date();
        return { requiresPasswordChange };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map