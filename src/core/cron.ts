import { CronJob } from 'cron';
import { createLogger } from './logger';

const logger = createLogger('Cron');

// @Cron

const sCron = Symbol('Cron');
export function Cron() {
  return function (target: Function) {
    Reflect.defineMetadata(sCron, true, target);
  } as ClassDecorator;
}

// @Schedule

const sScheduleHandlers = Symbol('ScheduleHandlers');
type ScheduleHandler = {
  schedule: string;
  target: Object;
  key: string | symbol;
};

export function Schedule(schedule: string) {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (!Reflect.hasMetadata(sScheduleHandlers, target)) {
      Reflect.defineMetadata(sScheduleHandlers, [], target);
    }

    const scheduleHandlers = Reflect.getMetadata(
      sScheduleHandlers,
      target
    ) as ScheduleHandler[];
    scheduleHandlers.push({
      schedule,
      target,
      key,
    });
  } as MethodDecorator;
}

function useSchedules(cronService: any) {
  const scheduleHandlers = Reflect.getMetadata(
    sScheduleHandlers,
    cronService
  ) as ScheduleHandler[];
  if (!scheduleHandlers || scheduleHandlers.length === 0) {
    return;
  }

  for (const scheduleHandler of scheduleHandlers) {
    const handler = scheduleHandler.target[scheduleHandler.key].bind(
      scheduleHandler.target
    ) as () => Promise<void> | void;
    const name = `${
      scheduleHandler.target.constructor.name
    }@${scheduleHandler.key.toString()}`;
    new CronJob(scheduleHandler.schedule, async () => {
      try {
        await handler();
      } catch (error: any) {
        logger.log(`Queue job "${name}" errored: `);
        logger.error(error.stack ? error.stack : error);
      }
    }).start();

    logger.log(`Schedule started: ${name} => ${scheduleHandler.schedule}`);
  }
}

// @QueueJob

const sQueueJobHandlers = Symbol('QueueJobHandlers');
type QueueJobHandler = {
  delayMs: number;
  target: Object;
  key: string | symbol;
};

export function QueueJob(delayMs: number) {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (!Reflect.hasMetadata(sQueueJobHandlers, target)) {
      Reflect.defineMetadata(sQueueJobHandlers, [], target);
    }

    const queueJobHandlers = Reflect.getMetadata(
      sQueueJobHandlers,
      target
    ) as QueueJobHandler[];
    queueJobHandlers.push({
      delayMs,
      target,
      key,
    });
  } as MethodDecorator;
}

function useQueueJobs(cronService: any) {
  const queueJobHandlers = Reflect.getMetadata(
    sQueueJobHandlers,
    cronService
  ) as QueueJobHandler[];
  if (!queueJobHandlers || queueJobHandlers.length === 0) {
    return;
  }

  for (const queueJobHandler of queueJobHandlers) {
    const handler = queueJobHandler.target[queueJobHandler.key].bind(
      queueJobHandler.target
    ) as () => Promise<void> | void;
    const name = `${
      queueJobHandler.target.constructor.name
    }@${queueJobHandler.key.toString()}`;

    const queueHandle = async () => {
      try {
        await handler();
      } catch (error: any) {
        logger.log(`Queue job "${name}" errored: `);
        logger.error(error.stack ? error.stack : error);
      }
      setTimeout(queueHandle, queueJobHandler.delayMs);
    };
    setTimeout(queueHandle, queueJobHandler.delayMs);

    logger.log(`Queue job started: ${name} => ${queueJobHandler.delayMs}`);
  }
}

// CronService metadata parsers

export function useCronService<T>(cronService: Object) {
  useSchedules(cronService);
  useQueueJobs(cronService);
}

// ScheduleExpression

export enum ScheduleExpression {
  EVERY_SECOND = '* * * * * *',
  EVERY_5_SECONDS = '*/5 * * * * *',
  EVERY_10_SECONDS = '*/10 * * * * *',
  EVERY_30_SECONDS = '*/30 * * * * *',
  EVERY_MINUTE = '*/1 * * * *',
  EVERY_5_MINUTES = '0 */5 * * * *',
  EVERY_10_MINUTES = '0 */10 * * * *',
  EVERY_30_MINUTES = '0 */30 * * * *',
  EVERY_HOUR = '0 0-23/1 * * *',
  EVERY_DAY = '0 0 0 * * *',
  EVERY_WEEK = '0 0 * * 0',
  EVERY_MONTH = '0 0 1 * 0',
  EVERY_QUARTER = '0 0 1 */3 *',
  EVERY_6_MONTHS = '0 0 1 */6 *',
  EVERY_YEAR = '0 0 1 1 *',
}
