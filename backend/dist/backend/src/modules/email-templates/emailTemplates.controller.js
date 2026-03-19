"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplatesController = exports.EmailTemplatesController = void 0;
const emailTemplates_service_1 = require("./emailTemplates.service");
class EmailTemplatesController {
    async list(req, res, next) {
        try {
            const result = await emailTemplates_service_1.emailTemplatesService.listTemplates(req.query);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const template = await emailTemplates_service_1.emailTemplatesService.getTemplateById(req.params.id);
            res.json({
                success: true,
                data: template,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const template = await emailTemplates_service_1.emailTemplatesService.createTemplate(req.body);
            res.status(201).json({
                success: true,
                data: template,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const template = await emailTemplates_service_1.emailTemplatesService.updateTemplate(req.params.id, req.body);
            res.json({
                success: true,
                data: template,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await emailTemplates_service_1.emailTemplatesService.deleteTemplate(req.params.id);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listLogs(req, res, next) {
        try {
            const result = await emailTemplates_service_1.emailTemplatesService.listEmailLogs(req.query);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(_req, res, next) {
        try {
            const stats = await emailTemplates_service_1.emailTemplatesService.getEmailStats();
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmailTemplatesController = EmailTemplatesController;
exports.emailTemplatesController = new EmailTemplatesController();
//# sourceMappingURL=emailTemplates.controller.js.map