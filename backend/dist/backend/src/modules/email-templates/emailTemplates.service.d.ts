import { EmailTemplate, EmailLog, PaginatedResponse } from 'shared';
import { CreateEmailTemplateInput, UpdateEmailTemplateInput, ListEmailTemplatesQuery, ListEmailLogsQuery } from './emailTemplates.schema';
export declare class EmailTemplatesService {
    listTemplates(query: ListEmailTemplatesQuery): Promise<PaginatedResponse<EmailTemplate>>;
    getTemplateById(id: string): Promise<EmailTemplate>;
    getTemplateByName(name: string): Promise<EmailTemplate | null>;
    createTemplate(input: CreateEmailTemplateInput): Promise<EmailTemplate>;
    updateTemplate(id: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate>;
    deleteTemplate(id: string): Promise<void>;
    listEmailLogs(query: ListEmailLogsQuery): Promise<PaginatedResponse<EmailLog>>;
    getEmailStats(): Promise<{
        sent: number;
        failed: number;
        pending: number;
        total: number;
    }>;
    seedDefaultTemplates(): Promise<void>;
}
export declare const emailTemplatesService: EmailTemplatesService;
//# sourceMappingURL=emailTemplates.service.d.ts.map