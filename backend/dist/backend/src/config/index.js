"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    // App defaults
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Lagos',
    // Session
    sessionInactivityMs: 30 * 60 * 1000, // 30 minutes
    // Password requirements
    password: {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSymbol: true,
    },
    // Attendance
    attendance: {
        defaultDeadlineTime: '23:59',
        defaultEditWindowMinutes: 60,
        defaultReminderMinutesBefore: 120,
    },
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        authMax: 10, // stricter limit for auth endpoints
    },
    // Email (SMTP)
    email: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'Church Attendance <noreply@church.com>',
    },
    // Cloudinary (image uploads)
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
};
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
function validateConfig() {
    const missing = requiredEnvVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=index.js.map