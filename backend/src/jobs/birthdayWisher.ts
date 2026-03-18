import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { emailService } from '../utils/email';
import { emailTemplatesService } from '../modules/email-templates/emailTemplates.service';
import { logger } from '../utils/logger';

// Schedule: Run at 6:00 AM daily
const BIRTHDAY_SCHEDULE = '0 6 * * *';

async function sendBirthdayWishes(): Promise<void> {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
  const currentDay = today.getDate();

  logger.info(`Checking for birthdays on ${currentMonth}/${currentDay}`);

  try {
    // Get the birthday template
    const template = await emailTemplatesService.getTemplateByName('birthday_wishes');

    if (!template || !template.isActive) {
      logger.info('Birthday email template not found or inactive, skipping birthday wishes');
      return;
    }

    // Find members with birthdays today who have email addresses
    const birthdayMembers = await prisma.member.findMany({
      where: {
        birthMonth: currentMonth,
        birthDay: currentDay,
        email: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (birthdayMembers.length === 0) {
      logger.info('No birthdays today');
      return;
    }

    logger.info(`Found ${birthdayMembers.length} members with birthdays today`);

    let sent = 0;
    let failed = 0;

    for (const member of birthdayMembers) {
      if (!member.email) continue;

      const subject = emailService.interpolateTemplate(template.subject, {
        firstName: member.firstName,
        lastName: member.lastName,
      });

      const body = emailService.interpolateTemplate(template.body, {
        firstName: member.firstName,
        lastName: member.lastName,
      });

      const result = await emailService.sendEmail({
        to: member.email,
        subject,
        html: body,
        recipientName: `${member.firstName} ${member.lastName}`,
        templateId: template.id,
      });

      if (result.success) {
        sent++;
        logger.info(`Birthday email sent to ${member.firstName} ${member.lastName}`);
      } else {
        failed++;
        logger.error(`Failed to send birthday email to ${member.firstName} ${member.lastName}: ${result.error}`);
      }

      // Small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    logger.info(`Birthday wishes complete: ${sent} sent, ${failed} failed`);
  } catch (error) {
    logger.error('Error in birthday wisher job', error);
  }
}

export function startBirthdayWisherJob(): void {
  cron.schedule(BIRTHDAY_SCHEDULE, async () => {
    logger.info('Running birthday wisher job');
    await sendBirthdayWishes();
  });

  logger.info('Birthday wisher job scheduled (daily at 6:00 AM)');
}

// Manual trigger function (useful for testing)
export async function triggerBirthdayWishes(): Promise<{ sent: number; failed: number }> {
  logger.info('Manually triggering birthday wishes');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const template = await emailTemplatesService.getTemplateByName('birthday_wishes');

  if (!template || !template.isActive) {
    return { sent: 0, failed: 0 };
  }

  const birthdayMembers = await prisma.member.findMany({
    where: {
      birthMonth: currentMonth,
      birthDay: currentDay,
      email: { not: null },
      isActive: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const member of birthdayMembers) {
    if (!member.email) continue;

    const subject = emailService.interpolateTemplate(template.subject, {
      firstName: member.firstName,
      lastName: member.lastName,
    });

    const body = emailService.interpolateTemplate(template.body, {
      firstName: member.firstName,
      lastName: member.lastName,
    });

    const result = await emailService.sendEmail({
      to: member.email,
      subject,
      html: body,
      recipientName: `${member.firstName} ${member.lastName}`,
      templateId: template.id,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
