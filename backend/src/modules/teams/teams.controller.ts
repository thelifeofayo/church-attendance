import { Request, Response, NextFunction } from 'express';
import { teamsService } from './teams.service';
import { ApiResponse, Team, TeamWithRelations, PaginatedResponse } from 'shared';
import { CreateTeamInput, UpdateTeamInput, ListTeamsQuery } from './teams.schema';

export class TeamsController {
  async list(
    req: Request<unknown, unknown, unknown, ListTeamsQuery>,
    res: Response<PaginatedResponse<TeamWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await teamsService.listTeams(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<TeamWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const team = await teamsService.getTeamById(req.params.id, req.user!);
      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateTeamInput>,
    res: Response<ApiResponse<Team>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const team = await teamsService.createTeam(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateTeamInput>,
    res: Response<ApiResponse<Team>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const team = await teamsService.updateTeam(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await teamsService.deactivateTeam(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const teamsController = new TeamsController();
