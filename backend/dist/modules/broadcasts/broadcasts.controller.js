"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastsController = exports.BroadcastsController = void 0;
const broadcasts_service_1 = require("./broadcasts.service");
class BroadcastsController {
    async list(req, res, next) {
        try {
            const result = await broadcasts_service_1.broadcastsService.listBroadcasts(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const broadcast = await broadcasts_service_1.broadcastsService.createBroadcast(req.body, req.user);
            res.status(201).json({
                success: true,
                data: broadcast,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async send(req, res, next) {
        try {
            const broadcast = await broadcasts_service_1.broadcastsService.sendBroadcast(req.params.id, req.user);
            res.json({
                success: true,
                data: broadcast,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await broadcasts_service_1.broadcastsService.deleteBroadcast(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BroadcastsController = BroadcastsController;
exports.broadcastsController = new BroadcastsController();
//# sourceMappingURL=broadcasts.controller.js.map