import cron from 'node-cron';
import { ServiceType } from 'shared';
import { attendanceService } from '../modules/attendance/attendance.service';
import { logger } from '../utils/logger';

// Schedule: Run at 00:01 AM on Wednesdays and Sundays
const WEDNESDAY_SCHEDULE = '1 0 * * 3'; // 00:01 on Wednesday
const SUNDAY_SCHEDULE = '1 0 * * 0'; // 00:01 on Sunday

export function startAttendanceJobs(): void {
  // Wednesday job
  cron.schedule(WEDNESDAY_SCHEDULE, async () => {
    logger.info('Running Wednesday attendance record creation job');
    try {
      const created = await attendanceService.createRecordsForServiceDay(ServiceType.WEDNESDAY);
      logger.info(`Created ${created} Wednesday attendance records`);
    } catch (error) {
      logger.error('Error creating Wednesday attendance records', error);
    }
  });

  // Sunday job
  cron.schedule(SUNDAY_SCHEDULE, async () => {
    logger.info('Running Sunday attendance record creation job');
    try {
      const created = await attendanceService.createRecordsForServiceDay(ServiceType.SUNDAY);
      logger.info(`Created ${created} Sunday attendance records`);
    } catch (error) {
      logger.error('Error creating Sunday attendance records', error);
    }
  });

  logger.info('Attendance record creation jobs scheduled');
}

// Manual trigger function (useful for testing or initial setup)
export async function triggerAttendanceRecordCreation(serviceType: ServiceType): Promise<number> {
  logger.info(`Manually triggering ${serviceType} attendance record creation`);
  const created = await attendanceService.createRecordsForServiceDay(serviceType);
  logger.info(`Created ${created} ${serviceType} attendance records`);
  return created;
}
