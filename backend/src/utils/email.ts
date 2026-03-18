import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';
import { prisma } from './prisma';

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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!config.email.host || !config.email.user) {
        throw new Error('Email configuration is incomplete. Please set SMTP environment variables.');
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
    return this.transporter;
  }

  isConfigured(): boolean {
    return !!(config.email.host && config.email.user && config.email.pass);
  }

  /**
   * Replace template placeholders with actual values
   */
  interpolateTemplate(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Send an email and log the result
   */
  async sendEmail(options: EmailOptions): Promise<SendResult> {
    const { to, subject, html, recipientName, templateId } = options;

    // Log the attempt
    const logEntry = await prisma.emailLog.create({
      data: {
        templateId: templateId || null,
        recipientEmail: to,
        recipientName: recipientName || to,
        subject,
        status: 'pending',
      },
    });

    if (!this.isConfigured()) {
      // If email is not configured, just log it
      logger.warn(`Email not configured. Would have sent to ${to}: ${subject}`);
      await prisma.emailLog.update({
        where: { id: logEntry.id },
        data: { status: 'failed', errorMessage: 'Email service not configured' },
      });
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });

      // Update log as sent
      await prisma.emailLog.update({
        where: { id: logEntry.id },
        data: { status: 'sent' },
      });

      logger.info(`Email sent successfully to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update log as failed
      await prisma.emailLog.update({
        where: { id: logEntry.id },
        data: { status: 'failed', errorMessage },
      });

      logger.error(`Failed to send email to ${to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send multiple emails (for broadcasts)
   */
  async sendBulkEmails(
    recipients: Array<{ email: string; firstName: string; lastName: string }>,
    subject: string,
    bodyTemplate: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const html = this.interpolateTemplate(bodyTemplate, {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
      });

      const result = await this.sendEmail({
        to: recipient.email,
        subject,
        html,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }
}

export const emailService = new EmailService();
