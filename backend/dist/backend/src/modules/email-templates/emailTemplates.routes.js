"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailTemplates_controller_1 = require("./emailTemplates.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const emailTemplates_schema_1 = require("./emailTemplates.schema");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireAdmin)());
router.get('/', (0, validate_1.validate)({ query: emailTemplates_schema_1.listEmailTemplatesQuerySchema }), emailTemplates_controller_1.emailTemplatesController.list);
router.get('/:id', (0, validate_1.validate)({ params: emailTemplates_schema_1.emailTemplateIdParamSchema }), emailTemplates_controller_1.emailTemplatesController.getById);
router.post('/', (0, validate_1.validate)({ body: emailTemplates_schema_1.createEmailTemplateSchema }), emailTemplates_controller_1.emailTemplatesController.create);
router.patch('/:id', (0, validate_1.validate)({ params: emailTemplates_schema_1.emailTemplateIdParamSchema, body: emailTemplates_schema_1.updateEmailTemplateSchema }), emailTemplates_controller_1.emailTemplatesController.update);
router.delete('/:id', (0, validate_1.validate)({ params: emailTemplates_schema_1.emailTemplateIdParamSchema }), emailTemplates_controller_1.emailTemplatesController.delete);
// Email logs routes
router.get('/logs/list', (0, validate_1.validate)({ query: emailTemplates_schema_1.listEmailLogsQuerySchema }), emailTemplates_controller_1.emailTemplatesController.listLogs);
router.get('/logs/stats', emailTemplates_controller_1.emailTemplatesController.getStats);
exports.default = router;
//# sourceMappingURL=emailTemplates.routes.js.map