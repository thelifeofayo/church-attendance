import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';
import { ApiResponse } from 'shared';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction
): void {
  logger.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(err.message);
    });

    const validationError = new ValidationError(details);
    res.status(validationError.statusCode).json({
      success: false,
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.details,
      },
    });
    return;
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${field} already exists`,
        },
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
      return;
    }
  }

  // Default to internal server error
  const internalError = new InternalServerError();
  res.status(internalError.statusCode).json({
    success: false,
    error: {
      code: internalError.code,
      message: config.nodeEnv === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    },
  });
}

// 404 handler
export function notFoundHandler(
  _req: Request,
  res: Response<ApiResponse<never>>
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
}
