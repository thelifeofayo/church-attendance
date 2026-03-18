import { Request, Response, NextFunction } from 'express';
import { ApiResponse, EmailTemplate, PaginatedResponse } from 'shared';
import { CreateEmailTemplateInput, UpdateEmailTemplateInput, ListEmailTemplatesQuery } from './emailTemplates.schema';
export declare class EmailTemplatesController {
    list(req: Request<unknown, unknown, unknown, ListEmailTemplatesQuery>, res: Response<PaginatedResponse<EmailTemplate>>, next: NextFunction): Promise<void>;
    getById(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<EmailTemplate>>, next: NextFunction): Promise<void>;
    create(req: Request<unknown, unknown, CreateEmailTemplateInput>, res: Response<ApiResponse<EmailTemplate>>, next: NextFunction): Promise<void>;
    update(req: Request<{
        id: string;
    }, unknown, UpdateEmailTemplateInput>, res: Response<ApiResponse<EmailTemplate>>, next: NextFunction): Promise<void>;
    delete(req: Request<{
        id: string;
    }>, res: Response<ApiResponse<void>>, next: NextFunction): Promise<void>;
}
export declare const emailTemplatesController: EmailTemplatesController;
//# sourceMappingURL=emailTemplates.controller.d.ts.map