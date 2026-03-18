"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const prisma_1 = require("./utils/prisma");
const attendanceRecordCreator_1 = require("./jobs/attendanceRecordCreator");
const birthdayWisher_1 = require("./jobs/birthdayWisher");
const emailTemplates_service_1 = require("./modules/email-templates/emailTemplates.service");
const logger_1 = require("./utils/logger");
async function main() {
    try {
        // Validate configuration
        (0, config_1.validateConfig)();
        // Connect to database
        await (0, prisma_1.connectDatabase)();
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start scheduled jobs
        (0, attendanceRecordCreator_1.startAttendanceJobs)();
        (0, birthdayWisher_1.startBirthdayWisherJob)();
        // Seed default email templates
        await emailTemplates_service_1.emailTemplatesService.seedDefaultTemplates();
        // Start server
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server running on port ${config_1.config.port}`);
            logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`Frontend URL: ${config_1.config.frontendUrl}`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                await (0, prisma_1.disconnectDatabase)();
                process.exit(0);
            });
            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map