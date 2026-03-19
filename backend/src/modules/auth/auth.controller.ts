import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse, LoginResponse, User, RefreshTokenResponse } from 'shared';
import {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schema';

export class AuthController {
  async login(
    req: Request<unknown, unknown, LoginInput>,
    res: Response<ApiResponse<LoginResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response<ApiResponse<RefreshTokenResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.refreshToken(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request<unknown, unknown, { refreshToken?: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await authService.logoutAll(req.user!.userId);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request<unknown, unknown, ForgotPasswordInput>,
    res: Response<
      ApiResponse<{
        resetToken?: string;
        resetUrl?: string;
      }>
    >,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request<unknown, unknown, ResetPasswordInput>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request<unknown, unknown, ChangePasswordInput>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await authService.changePassword(req.user!.userId, req.body);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(
    req: Request,
    res: Response<ApiResponse<User>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async passwordChangeStatus(
    req: Request,
    res: Response<
      ApiResponse<{
        requiresPasswordChange: boolean;
      }>
    >,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.getPasswordChangeStatus(req.user!.userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
