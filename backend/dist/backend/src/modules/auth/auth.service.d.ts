import { LoginResponse, User } from 'shared';
import { LoginInput, RefreshTokenInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from './auth.schema';
export declare class AuthService {
    login(input: LoginInput): Promise<LoginResponse>;
    refreshToken(input: RefreshTokenInput): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    forgotPassword(input: ForgotPasswordInput): Promise<{
        resetToken?: string;
        resetUrl?: string;
    }>;
    resetPassword(input: ResetPasswordInput): Promise<void>;
    changePassword(userId: string, input: ChangePasswordInput): Promise<void>;
    getCurrentUser(userId: string): Promise<User>;
    getPasswordChangeStatus(userId: string): Promise<{
        requiresPasswordChange: boolean;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map