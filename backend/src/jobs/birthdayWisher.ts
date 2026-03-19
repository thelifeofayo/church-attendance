import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { emailService } from '../utils/email';
import { emailTemplatesService } from '../modules/email-templates/emailTemplates.service';
import { logger } from '../utils/logger';

const BIRTHDAY_SCHEDULE = '0 6 * * *';

interface BirthdayPerson {
  firstName: string;
  lastName: string;
  email: string;
  source: 'member' | 'user';
}

async function getBirthdayPeople(month: number, day: number): Promise<BirthdayPerson[]> {
  const [members, users] = await Promise.all([
    prisma.member.findMany({
      where: {
        birthMonth: month,
        birthDay: day,
        email: { not: null },
        isActive: true,
      },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.user.findMany({
      where: {
        birthMonth: month,
        birthDay: day,
        isActive: true,
      },
      select: { firstName: true, lastName: true, email: true },
    }),
  ]);

  const people: BirthdayPerson[] = [];
  const seenEmails = new Set<string>();

  for (const m of members) {
    if (!m.email) continue;
    const key = m.email.toLowerCase();
    if (!seenEmails.has(key)) {
      seenEmails.add(key);
      people.push({ firstName: m.firstName, lastName: m.lastName, email: m.email, source: 'member' });
    }
  }

  for (const u of users) {
    const key = u.email.toLowerCase();
    if (!seenEmails.has(key)) {
      seenEmails.add(key);
      people.push({ firstName: u.firstName, lastName: u.lastName, email: u.email, source: 'user' });
    }
  }

  return people;
}

async function sendBirthdayWishes(): Promise<void> {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  logger.info(`Checking for birthdays on ${currentMonth}/${currentDay}`);

  try {
    const template = await emailTemplatesService.getTemplateByName('birthday_wishes');

    if (!template || !template.isActive) {
      logger.info('Birthday email template not found or inactive, skipping');
      return;
    }

    const birthdayPeople = await getBirthdayPeople(currentMonth, currentDay);

    if (birthdayPeople.length === 0) {
      logger.info('No birthdays today');
      return;
    }

    logger.info(`Found ${birthdayPeople.length} people with birthdays today (members + users)`);

    let sent = 0;
    let failed = 0;

    for (const person of birthdayPeople) {
      const subject = emailService.interpolateTemplate(template.subject, {
        firstName: person.firstName,
        lastName: person.lastName,
      });

      const body = emailService.interpolateTemplate(template.body, {
        firstName: person.firstName,
        lastName: person.lastName,
      });

      const result = await emailService.sendEmail({
        to: person.email,
        subject,
        html: body,
        recipientName: `${person.firstName} ${person.lastName}`,
        templateId: template.id,
      });

      if (result.success) {
        sent++;
        logger.info(`Birthday email sent to ${person.firstName} ${person.lastName} (${person.source})`);
      } else {
        failed++;
        logger.error(`Failed to send birthday email to ${person.firstName} ${person.lastName}: ${result.error}`);
      }

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

export async function triggerBirthdayWishes(): Promise<{ sent: number; failed: number }> {
  logger.info('Manually triggering birthday wishes');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const template = await emailTemplatesService.getTemplateByName('birthday_wishes');

  if (!template || !template.isActive) {
    return { sent: 0, failed: 0 };
  }

  const birthdayPeople = await getBirthdayPeople(currentMonth, currentDay);

  let sent = 0;
  let failed = 0;

  for (const person of birthdayPeople) {
    const subject = emailService.interpolateTemplate(template.subject, {
      firstName: person.firstName,
      lastName: person.lastName,
    });

    const body = emailService.interpolateTemplate(template.body, {
      firstName: person.firstName,
      lastName: person.lastName,
    });

    const result = await emailService.sendEmail({
      to: person.email,
      subject,
      html: body,
      recipientName: `${person.firstName} ${person.lastName}`,
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
