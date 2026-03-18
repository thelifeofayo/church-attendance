import { EmailTemplate, PaginatedResponse } from 'shared';
import { CreateEmailTemplateInput, UpdateEmailTemplateInput, ListEmailTemplatesQuery } from './emailTemplates.schema';
export declare class EmailTemplatesService {
    listTemplates(query: ListEmailTemplatesQuery): Promise<PaginatedResponse<EmailTemplate>>;
    getTemplateById(id: string): Promise<EmailTemplate>;
    getTemplateByName(name: string): Promise<EmailTemplate | null>;
    createTemplate(input: CreateEmailTemplateInput): Promise<EmailTemplate>;
    updateTemplate(id: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate>;
    deleteTemplate(id: string): Promise<void>;
    seedDefaultTemplates(): Promise<void>;
}
export declare const emailTemplatesService: EmailTemplatesService;
//# sourceMappingURL=emailTemplates.service.d.ts.map