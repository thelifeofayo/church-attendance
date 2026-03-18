"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const teams_routes_1 = __importDefault(require("./modules/teams/teams.routes"));
const departments_routes_1 = __importDefault(require("./modules/departments/departments.routes"));
const members_routes_1 = __importDefault(require("./modules/members/members.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const emailTemplates_routes_1 = __importDefault(require("./modules/email-templates/emailTemplates.routes"));
const broadcasts_routes_1 = __importDefault(require("./modules/broadcasts/broadcasts.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: config_1.config.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
    // Stricter rate limit for auth endpoints
    const authLimiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.authMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    });
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // API routes
    app.use('/api/auth', authLimiter, auth_routes_1.default);
    app.use('/api/users', users_routes_1.default);
    app.use('/api/teams', teams_routes_1.default);
    app.use('/api/departments', departments_routes_1.default);
    app.use('/api/members', members_routes_1.default);
    app.use('/api/attendance', attendance_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api/reports', reports_routes_1.default);
    app.use('/api/email-templates', emailTemplates_routes_1.default);
    app.use('/api/broadcasts', broadcasts_routes_1.default);
    // 404 handler
    app.use(errorHandler_1.notFoundHandler);
    // Error handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map