"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentsController = exports.DepartmentsController = void 0;
const departments_service_1 = require("./departments.service");
class DepartmentsController {
    async list(req, res, next) {
        try {
            const result = await departments_service_1.departmentsService.listDepartments(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const department = await departments_service_1.departmentsService.getDepartmentById(req.params.id, req.user);
            res.json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const department = await departments_service_1.departmentsService.createDepartment(req.body, req.user);
            res.status(201).json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const department = await departments_service_1.departmentsService.updateDepartment(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async assignHOD(req, res, next) {
        try {
            const department = await departments_service_1.departmentsService.assignHOD(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await departments_service_1.departmentsService.deactivateDepartment(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DepartmentsController = DepartmentsController;
exports.departmentsController = new DepartmentsController();
//# sourceMappingURL=departments.controller.js.map