import { Request, Response, NextFunction } from 'express';
import { broadcastsService } from './broadcasts.service';
import { ApiResponse, Broadcast, BroadcastWithCreator, PaginatedResponse } from 'shared';
import { CreateBroadcastInput, ListBroadcastsQuery } from './broadcasts.schema';

export class BroadcastsController {
  async list(
    req: Request<unknown, unknown, unknown, ListBroadcastsQuery>,
    res: Response<PaginatedResponse<BroadcastWithCreator>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await broadcastsService.listBroadcasts(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateBroadcastInput>,
    res: Response<ApiResponse<Broadcast>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const broadcast = await broadcastsService.createBroadcast(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: broadcast,
      });
    } catch (error) {
      next(error);
    }
  }

  async send(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<Broadcast>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const broadcast = await broadcastsService.sendBroadcast(req.params.id, req.user!);
      res.json({
        success: true,
        data: broadcast,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await broadcastsService.deleteBroadcast(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const broadcastsController = new BroadcastsController();
