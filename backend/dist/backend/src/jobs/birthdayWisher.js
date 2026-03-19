"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBirthdayWisherJob = startBirthdayWisherJob;
exports.triggerBirthdayWishes = triggerBirthdayWishes;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../utils/prisma");
const email_1 = require("../utils/email");
const emailTemplates_service_1 = require("../modules/email-templates/emailTemplates.service");
const logger_1 = require("../utils/logger");
const BIRTHDAY_SCHEDULE = '0 6 * * *';
async function getBirthdayPeople(month, day) {
    const [members, users] = await Promise.all([
        prisma_1.prisma.member.findMany({
            where: {
                birthMonth: month,
                birthDay: day,
                email: { not: null },
                isActive: true,
            },
            select: { firstName: true, lastName: true, email: true },
        }),
        prisma_1.prisma.user.findMany({
            where: {
                birthMonth: month,
                birthDay: day,
                isActive: true,
            },
            select: { firstName: true, lastName: true, email: true },
        }),
    ]);
    const people = [];
    const seenEmails = new Set();
    for (const m of members) {
        if (!m.email)
            continue;
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
async function sendBirthdayWishes() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    logger_1.logger.info(`Checking for birthdays on ${currentMonth}/${currentDay}`);
    try {
        const template = await emailTemplates_service_1.emailTemplatesService.getTemplateByName('birthday_wishes');
        if (!template || !template.isActive) {
            logger_1.logger.info('Birthday email template not found or inactive, skipping');
            return;
        }
        const birthdayPeople = await getBirthdayPeople(currentMonth, currentDay);
        if (birthdayPeople.length === 0) {
            logger_1.logger.info('No birthdays today');
            return;
        }
        logger_1.logger.info(`Found ${birthdayPeople.length} people with birthdays today (members + users)`);
        let sent = 0;
        let failed = 0;
        for (const person of birthdayPeople) {
            const subject = email_1.emailService.interpolateTemplate(template.subject, {
                firstName: person.firstName,
                lastName: person.lastName,
            });
            const body = email_1.emailService.interpolateTemplate(template.body, {
                firstName: person.firstName,
                lastName: person.lastName,
            });
            const result = await email_1.emailService.sendEmail({
                to: person.email,
                subject,
                html: body,
                recipientName: `${person.firstName} ${person.lastName}`,
                templateId: template.id,
            });
            if (result.success) {
                sent++;
                logger_1.logger.info(`Birthday email sent to ${person.firstName} ${person.lastName} (${person.source})`);
            }
            else {
                failed++;
                logger_1.logger.error(`Failed to send birthday email to ${person.firstName} ${person.lastName}: ${result.error}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        logger_1.logger.info(`Birthday wishes complete: ${sent} sent, ${failed} failed`);
    }
    catch (error) {
        logger_1.logger.error('Error in birthday wisher job', error);
    }
}
function startBirthdayWisherJob() {
    node_cron_1.default.schedule(BIRTHDAY_SCHEDULE, async () => {
        logger_1.logger.info('Running birthday wisher job');
        await sendBirthdayWishes();
    });
    logger_1.logger.info('Birthday wisher job scheduled (daily at 6:00 AM)');
}
async function triggerBirthdayWishes() {
    logger_1.logger.info('Manually triggering birthday wishes');
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const template = await emailTemplates_service_1.emailTemplatesService.getTemplateByName('birthday_wishes');
    if (!template || !template.isActive) {
        return { sent: 0, failed: 0 };
    }
    const birthdayPeople = await getBirthdayPeople(currentMonth, currentDay);
    let sent = 0;
    let failed = 0;
    for (const person of birthdayPeople) {
        const subject = email_1.emailService.interpolateTemplate(template.subject, {
            firstName: person.firstName,
            lastName: person.lastName,
        });
        const body = email_1.emailService.interpolateTemplate(template.body, {
            firstName: person.firstName,
            lastName: person.lastName,
        });
        const result = await email_1.emailService.sendEmail({
            to: person.email,
            subject,
            html: body,
            recipientName: `${person.firstName} ${person.lastName}`,
            templateId: template.id,
        });
        if (result.success) {
            sent++;
        }
        else {
            failed++;
        }
    }
    return { sent, failed };
}
//# sourceMappingURL=birthdayWisher.js.map