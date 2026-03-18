import { Request, Response, NextFunction } from 'express';
import { emailTemplatesService } from './emailTemplates.service';
import { ApiResponse, EmailTemplate, EmailLog, PaginatedResponse } from 'shared';
import { CreateEmailTemplateInput, UpdateEmailTemplateInput, ListEmailTemplatesQuery, ListEmailLogsQuery } from './emailTemplates.schema';

export class EmailTemplatesController {
  async list(
    req: Request<unknown, unknown, unknown, ListEmailTemplatesQuery>,
    res: Response<PaginatedResponse<EmailTemplate>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await emailTemplatesService.listTemplates(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response<ApiResponse<EmailTemplate>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const template = await emailTemplatesService.getTemplateById(req.params.id);
      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request<unknown, unknown, CreateEmailTemplateInput>,
    res: Response<ApiResponse<EmailTemplate>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const template = await emailTemplatesService.createTemplate(req.body);
      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateEmailTemplateInput>,
    res: Response<ApiResponse<EmailTemplate>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const template = await emailTemplatesService.updateTemplate(req.params.id, req.body);
      res.json({
        success: true,
        data: template,
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
      await emailTemplatesService.deleteTemplate(req.params.id);
      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async listLogs(
    req: Request<unknown, unknown, unknown, ListEmailLogsQuery>,
    res: Response<PaginatedResponse<EmailLog>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await emailTemplatesService.listEmailLogs(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(
    _req: Request,
    res: Response<ApiResponse<{ sent: number; failed: number; pending: number; total: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await emailTemplatesService.getEmailStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const emailTemplatesController = new EmailTemplatesController();
