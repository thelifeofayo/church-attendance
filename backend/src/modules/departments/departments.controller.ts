import { Request, Response, NextFunction } from 'express';
import { departmentsService } from './departments.service';
import { ApiResponse, Department, DepartmentWithRelations, PaginatedResponse } from 'shared';
import { CreateDepartmentInput, UpdateDepartmentInput, AssignHODInput, ListDepartmentsQuery } from './departments.schema';

export class DepartmentsController {
  async list(
    req: Request<unknown, unknown, unknown, ListDepartmentsQuery>,
    res: Response<PaginatedResponse<DepartmentWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await departmentsService.listDepartments(req.query, req.user!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<DepartmentWithRelations>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentsService.getDepartmentById(req.params.id, req.user!);
      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateDepartmentInput>,
    res: Response<ApiResponse<Department>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentsService.createDepartment(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateDepartmentInput>,
    res: Response<ApiResponse<Department>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentsService.updateDepartment(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignHOD(
    req: Request<{ id: string }, unknown, AssignHODInput>,
    res: Response<ApiResponse<Department>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentsService.assignHOD(req.params.id, req.body, req.user!);
      res.json({
        success: true,
        data: department,
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
      await departmentsService.deactivateDepartment(req.params.id, req.user!);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentsController = new DepartmentsController();
