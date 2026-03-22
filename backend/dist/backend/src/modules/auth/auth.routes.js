"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', (0, validate_1.validate)({ body: auth_schema_1.loginSchema }), auth_controller_1.authController.login);
router.post('/refresh', (0, validate_1.validate)({ body: auth_schema_1.refreshTokenSchema }), auth_controller_1.authController.refreshToken);
router.post('/forgot-password', (0, validate_1.validate)({ body: auth_schema_1.forgotPasswordSchema }), auth_controller_1.authController.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)({ body: auth_schema_1.resetPasswordSchema }), auth_controller_1.authController.resetPassword);
// Protected routes
router.post('/logout', auth_1.authenticate, auth_controller_1.authController.logout);
router.post('/logout-all', auth_1.authenticate, auth_controller_1.authController.logoutAll);
router.post('/change-password', auth_1.authenticate, (0, validate_1.validate)({ body: auth_schema_1.changePasswordSchema }), auth_controller_1.authController.changePassword);
router.get('/me', auth_1.authenticate, auth_controller_1.authController.me);
router.get('/password-change-status', auth_1.authenticate, auth_controller_1.authController.passwordChangeStatus);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map