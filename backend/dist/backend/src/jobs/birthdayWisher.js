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
// Schedule: Run at 6:00 AM daily
const BIRTHDAY_SCHEDULE = '0 6 * * *';
async function sendBirthdayWishes() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
    const currentDay = today.getDate();
    logger_1.logger.info(`Checking for birthdays on ${currentMonth}/${currentDay}`);
    try {
        // Get the birthday template
        const template = await emailTemplates_service_1.emailTemplatesService.getTemplateByName('birthday_wishes');
        if (!template || !template.isActive) {
            logger_1.logger.info('Birthday email template not found or inactive, skipping birthday wishes');
            return;
        }
        // Find members with birthdays today who have email addresses
        const birthdayMembers = await prisma_1.prisma.member.findMany({
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
            logger_1.logger.info('No birthdays today');
            return;
        }
        logger_1.logger.info(`Found ${birthdayMembers.length} members with birthdays today`);
        let sent = 0;
        let failed = 0;
        for (const member of birthdayMembers) {
            if (!member.email)
                continue;
            const subject = email_1.emailService.interpolateTemplate(template.subject, {
                firstName: member.firstName,
                lastName: member.lastName,
            });
            const body = email_1.emailService.interpolateTemplate(template.body, {
                firstName: member.firstName,
                lastName: member.lastName,
            });
            const result = await email_1.emailService.sendEmail({
                to: member.email,
                subject,
                html: body,
                recipientName: `${member.firstName} ${member.lastName}`,
                templateId: template.id,
            });
            if (result.success) {
                sent++;
                logger_1.logger.info(`Birthday email sent to ${member.firstName} ${member.lastName}`);
            }
            else {
                failed++;
                logger_1.logger.error(`Failed to send birthday email to ${member.firstName} ${member.lastName}: ${result.error}`);
            }
            // Small delay between emails
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
// Manual trigger function (useful for testing)
async function triggerBirthdayWishes() {
    logger_1.logger.info('Manually triggering birthday wishes');
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const template = await emailTemplates_service_1.emailTemplatesService.getTemplateByName('birthday_wishes');
    if (!template || !template.isActive) {
        return { sent: 0, failed: 0 };
    }
    const birthdayMembers = await prisma_1.prisma.member.findMany({
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
        if (!member.email)
            continue;
        const subject = email_1.emailService.interpolateTemplate(template.subject, {
            firstName: member.firstName,
            lastName: member.lastName,
        });
        const body = email_1.emailService.interpolateTemplate(template.body, {
            firstName: member.firstName,
            lastName: member.lastName,
        });
        const result = await email_1.emailService.sendEmail({
            to: member.email,
            subject,
            html: body,
            recipientName: `${member.firstName} ${member.lastName}`,
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