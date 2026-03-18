"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.membersController = exports.MembersController = void 0;
const members_service_1 = require("./members.service");
class MembersController {
    async list(req, res, next) {
        try {
            const result = await members_service_1.membersService.listMembers(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const member = await members_service_1.membersService.getMemberById(req.params.id, req.user);
            res.json({
                success: true,
                data: member,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const member = await members_service_1.membersService.createMember(req.body, req.user);
            res.status(201).json({
                success: true,
                data: member,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const member = await members_service_1.membersService.updateMember(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: member,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await members_service_1.membersService.deactivateMember(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async reactivate(req, res, next) {
        try {
            await members_service_1.membersService.reactivateMember(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MembersController = MembersController;
exports.membersController = new MembersController();
//# sourceMappingURL=members.controller.js.map