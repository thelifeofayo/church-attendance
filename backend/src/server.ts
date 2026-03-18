import { createApp } from './app';
import { config, validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './utils/prisma';
import { startAttendanceJobs } from './jobs/attendanceRecordCreator';
import { startBirthdayWisherJob } from './jobs/birthdayWisher';
import { emailTemplatesService } from './modules/email-templates/emailTemplates.service';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start scheduled jobs
    startAttendanceJobs();
    startBirthdayWisherJob();

    // Seed default email templates
    await emailTemplatesService.seedDefaultTemplates();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
