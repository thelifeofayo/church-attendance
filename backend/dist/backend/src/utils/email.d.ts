interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    recipientName?: string;
    templateId?: string;
}
interface SendResult {
    success: boolean;
    error?: string;
}
declare class EmailService {
    private transporter;
    private getTransporter;
    isConfigured(): boolean;
    /**
     * Replace template placeholders with actual values
     */
    interpolateTemplate(template: string, data: Record<string, string>): string;
    /**
     * Send an email and log the result
     */
    sendEmail(options: EmailOptions): Promise<SendResult>;
    /**
     * Send multiple emails (for broadcasts)
     */
    sendBulkEmails(recipients: Array<{
        email: string;
        firstName: string;
        lastName: string;
    }>, subject: string, bodyTemplate: string): Promise<{
        sent: number;
        failed: number;
    }>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.d.ts.map