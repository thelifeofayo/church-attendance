import { Request, Response, NextFunction } from 'express';
import { membersService } from './members.service';
import { ApiResponse, Member, MemberWithRelations, PaginatedResponse } from 'shared';
import { CreateMemberInput, UpdateMemberInput, ListMembersQuery } from './members.schema';

export class MembersController {
  async list(
    req: Request<unknown, unknown, unknown, ListMembersQuery>,
    res: Response<PaginatedResponse<Member>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await membersService.listMembers(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<MemberWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const member = await membersService.getMemberById(req.params.id, req.user!);
      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateMemberInput>,
    res: Response<ApiResponse<Member>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const member = await membersService.createMember(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateMemberInput>,
    res: Response<ApiResponse<Member>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const member = await membersService.updateMember(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: member,
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
      await membersService.deactivateMember(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async reactivate(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      await membersService.reactivateMember(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const membersController = new MembersController();
