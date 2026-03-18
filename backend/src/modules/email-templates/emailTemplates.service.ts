import { prisma } from '../../utils/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { EmailTemplate, EmailLog, PaginatedResponse } from 'shared';
import { CreateEmailTemplateInput, UpdateEmailTemplateInput, ListEmailTemplatesQuery, ListEmailLogsQuery } from './emailTemplates.schema';

export class EmailTemplatesService {
  async listTemplates(query: ListEmailTemplatesQuery): Promise<PaginatedResponse<EmailTemplate>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.emailTemplate.count(),
    ]);

    return {
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Email template');
    }

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    const template = await prisma.emailTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async createTemplate(input: CreateEmailTemplateInput): Promise<EmailTemplate> {
    const { name, subject, body } = input;

    // Check for existing template with same name
    const existing = await prisma.emailTemplate.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ConflictError('A template with this name already exists');
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
      },
    });

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async updateTemplate(id: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate> {
    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Email template');
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(input.subject && { subject: input.subject }),
        ...(input.body && { body: input.body }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Email template');
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });
  }

  // List email logs
  async listEmailLogs(query: ListEmailLogsQuery): Promise<PaginatedResponse<EmailLog>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        templateId: log.templateId,
        recipientEmail: log.recipientEmail,
        recipientName: log.recipientName,
        subject: log.subject,
        status: log.status as EmailLog['status'],
        errorMessage: log.errorMessage,
        sentAt: log.sentAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get email stats
  async getEmailStats(): Promise<{ sent: number; failed: number; pending: number; total: number }> {
    const [sent, failed, pending] = await Promise.all([
      prisma.emailLog.count({ where: { status: 'sent' } }),
      prisma.emailLog.count({ where: { status: 'failed' } }),
      prisma.emailLog.count({ where: { status: 'pending' } }),
    ]);

    return {
      sent,
      failed,
      pending,
      total: sent + failed + pending,
    };
  }

  // Seed default templates if they don't exist
  async seedDefaultTemplates(): Promise<void> {
    const birthdayTemplate = await this.getTemplateByName('birthday_wishes');

    if (!birthdayTemplate) {
      await prisma.emailTemplate.create({
        data: {
          name: 'birthday_wishes',
          subject: 'Happy Birthday, {{firstName}}! 🎂',
          body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Happy Birthday! 🎉</h1>
    </div>
    <div class="content">
      <p>Dear {{firstName}} {{lastName}},</p>
      <p>On behalf of the entire church family, we want to wish you a very Happy Birthday!</p>
      <p>May God bless you abundantly on this special day and throughout the coming year. May His grace, love, and peace be with you always.</p>
      <p>Have a wonderful celebration!</p>
      <p>With love and blessings,<br/>Your Church Family</p>
    </div>
    <div class="footer">
      <p>This is an automated birthday message from the Church Attendance System.</p>
    </div>
  </div>
</body>
</html>
          `.trim(),
          isActive: true,
        },
      });
    }
  }
}

export const emailTemplatesService = new EmailTemplatesService();
