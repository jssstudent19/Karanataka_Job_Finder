const cron = require('node-cron');
const jobAggregatorService = require('./jobAggregatorService');
const logger = require('../src/config/logger');

class JobScheduler {
  constructor() {
    this.scheduledTask = null;
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
    this.runCount = 0;
  }

  /**
   * Start the job aggregation scheduler
   * Default: Runs every 24 hours (can be configured via environment variable)
   */
  start() {
    if (this.scheduledTask) {
      logger.info('Job scheduler is already running');
      return;
    }

    const intervalHours = parseInt(process.env.SCRAPING_INTERVAL_HOURS) || 24;
    const isEnabled = process.env.SCRAPING_ENABLED === 'true';

    if (!isEnabled) {
      logger.info('Job scraping is disabled via environment variable');
      return;
    }

    // Convert hours to cron format
    // For every N hours, we use: 0 */N * * *
    const cronExpression = `0 */${intervalHours} * * *`;

    logger.info(`Starting job aggregation scheduler: Running every ${intervalHours} hours`);
    logger.info(`Cron expression: ${cronExpression}`);

    this.scheduledTask = cron.schedule(cronExpression, async () => {
      await this.runAggregation();
    });

    this.calculateNextRun(intervalHours);
    logger.info(`Job scheduler started successfully. Next run: ${this.nextRun}`);
  }

  /**
   * Stop the job aggregation scheduler
   */
  stop() {
    if (!this.scheduledTask) {
      logger.info('Job scheduler is not running');
      return;
    }

    this.scheduledTask.stop();
    this.scheduledTask = null;
    this.nextRun = null;
    logger.info('Job scheduler stopped successfully');
  }

  /**
   * Run job aggregation manually
   */
  async runAggregation() {
    if (this.isRunning) {
      logger.warn('Job aggregation is already running. Skipping this cycle.');
      return;
    }

    this.isRunning = true;
    this.runCount++;
    const startTime = Date.now();

    logger.info(`Starting scheduled job aggregation (Run #${this.runCount})`);

    try {
      const result = await jobAggregatorService.fetchAndSaveAllJobs({
        location: process.env.DEFAULT_SEARCH_LOCATION || 'Karnataka,India',
        limitPerSource: parseInt(process.env.MAX_JOBS_PER_SCRAPE) || 100,
        sources: ['jsearch', 'adzuna', 'careerjet', 'themuse', 'remotive', 'arbeitnow']
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.lastRun = new Date();

      logger.info(`Scheduled job aggregation completed successfully in ${duration}s`, {
        totalJobs: result.aggregationResults?.total || 0,
        savedJobs: result.saveResults?.savedCount || 0,
        updatedJobs: result.saveResults?.updatedCount || 0,
        errors: result.saveResults?.errorCount || 0
      });

    } catch (error) {
      logger.error('Scheduled job aggregation failed:', error);
    } finally {
      this.isRunning = false;
      this.calculateNextRun(parseInt(process.env.SCRAPING_INTERVAL_HOURS) || 24);
    }
  }

  /**
   * Calculate next run time
   */
  calculateNextRun(intervalHours) {
    const now = new Date();
    this.nextRun = new Date(now.getTime() + (intervalHours * 60 * 60 * 1000));
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.scheduledTask !== null,
      isCurrentlyExecuting: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      runCount: this.runCount,
      intervalHours: parseInt(process.env.SCRAPING_INTERVAL_HOURS) || 24,
      enabled: process.env.SCRAPING_ENABLED === 'true'
    };
  }

  /**
   * Run aggregation immediately (manual trigger)
   */
  async triggerNow() {
    logger.info('Manual job aggregation triggered');
    await this.runAggregation();
  }
}

// Export singleton instance
module.exports = new JobScheduler();
