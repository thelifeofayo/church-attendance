"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
function errorHandler(error, _req, res, _next) {
    logger_1.logger.error(error);
    // Handle Zod validation errors
    if (error instanceof zod_1.ZodError) {
        const details = {};
        error.errors.forEach((err) => {
            const path = err.path.join('.');
            if (!details[path]) {
                details[path] = [];
            }
            details[path].push(err.message);
        });
        const validationError = new errors_1.ValidationError(details);
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
    if (error instanceof errors_1.AppError) {
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
        const prismaError = error;
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
    const internalError = new errors_1.InternalServerError();
    res.status(internalError.statusCode).json({
        success: false,
        error: {
            code: internalError.code,
            message: config_1.config.nodeEnv === 'production'
                ? 'An unexpected error occurred'
                : error.message,
        },
    });
}
// 404 handler
function notFoundHandler(_req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
}
//# sourceMappingURL=errorHandler.js.map