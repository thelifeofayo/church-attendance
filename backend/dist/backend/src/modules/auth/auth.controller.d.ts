import { Request, Response, NextFunction } from 'express';
import { ApiResponse, LoginResponse, User, RefreshTokenResponse } from 'shared';
import { LoginInput, RefreshTokenInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from './auth.schema';
export declare class AuthController {
    login(req: Request<unknown, unknown, LoginInput>, res: Response<ApiResponse<LoginResponse>>, next: NextFunction): Promise<void>;
    refreshToken(req: Request<unknown, unknown, RefreshTokenInput>, res: Response<ApiResponse<RefreshTokenResponse>>, next: NextFunction): Promise<void>;
    logout(req: Request<unknown, unknown, {
        refreshToken?: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    logoutAll(req: Request, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    forgotPassword(req: Request<unknown, unknown, ForgotPasswordInput>, res: Response<ApiResponse<{
        resetToken?: string;
        resetUrl?: string;
    }>>, next: NextFunction): Promise<void>;
    resetPassword(req: Request<unknown, unknown, ResetPasswordInput>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    changePassword(req: Request<unknown, unknown, ChangePasswordInput>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
    me(req: Request, res: Response<ApiResponse<User>>, next: NextFunction): Promise<void>;
    passwordChangeStatus(req: Request, res: Response<ApiResponse<{
        requiresPasswordChange: boolean;
    }>>, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map