"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsController = exports.TeamsController = void 0;
const teams_service_1 = require("./teams.service");
class TeamsController {
    async list(req, res, next) {
        try {
            const result = await teams_service_1.teamsService.listTeams(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const team = await teams_service_1.teamsService.getTeamById(req.params.id, req.user);
            res.json({
                success: true,
                data: team,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const team = await teams_service_1.teamsService.createTeam(req.body, req.user);
            res.status(201).json({
                success: true,
                data: team,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const team = await teams_service_1.teamsService.updateTeam(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: team,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await teams_service_1.teamsService.deactivateTeam(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TeamsController = TeamsController;
exports.teamsController = new TeamsController();
//# sourceMappingURL=teams.controller.js.map