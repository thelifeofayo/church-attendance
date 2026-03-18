"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = exports.UsersController = void 0;
const users_service_1 = require("./users.service");
class UsersController {
    async list(req, res, next) {
        try {
            const result = await users_service_1.usersService.listUsers(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const user = await users_service_1.usersService.getUserById(req.params.id, req.user);
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const user = await users_service_1.usersService.createUser(req.body, req.user);
            res.status(201).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const user = await users_service_1.usersService.updateUser(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await users_service_1.usersService.deactivateUser(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UsersController = UsersController;
exports.usersController = new UsersController();
//# sourceMappingURL=users.controller.js.map