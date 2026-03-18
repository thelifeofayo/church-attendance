"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = require("../../utils/prisma");
const password_1 = require("../../utils/password");
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
                departmentAsHOD: { select: { id: true, teamId: true } },
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
        // Determine team and department IDs based on role
        let teamId = null;
        let departmentId = null;
        if (user.role === shared_1.Role.TEAM_HEAD && user.teamAsHead) {
            teamId = user.teamAsHead.id;
        }
        else if (user.role === shared_1.Role.HOD && user.departmentAsHOD) {
            departmentId = user.departmentAsHOD.id;
            teamId = user.departmentAsHOD.teamId;
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
        return {
            user: userResponse,
            accessToken,
            refreshToken,
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
                        departmentAsHOD: { select: { id: true, teamId: true } },
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
        else if (user.role === shared_1.Role.HOD && user.departmentAsHOD) {
            departmentId = user.departmentAsHOD.id;
            teamId = user.departmentAsHOD.teamId;
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
        });
        // Always return success to prevent email enumeration
        if (!user || !user.isActive) {
            return;
        }
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma_1.prisma.user.update({
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
            data: { passwordHash },
        });
        // Invalidate all refresh tokens (force re-login)
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
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map