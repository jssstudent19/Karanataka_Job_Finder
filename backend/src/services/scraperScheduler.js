const cron = require('node-cron');
const jobScraperManager = require('./jobScraperManager');
const logger = require('../config/logger');

class ScraperScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Initialize and start scheduled jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scraper scheduler is already running');
      return;
    }

    // Daily scraping at 2 AM
    const dailyJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled daily job scraping');
      
      try {
        const results = await jobScraperManager.scrapeJobs({
          query: 'software developer engineer analyst',
          location: 'Karnataka',
          sources: ['indeed', 'naukri', 'linkedin'],
          limit: 100
        });
        
        logger.info('Scheduled scraping completed', results);
      } catch (error) {
        logger.error('Scheduled scraping failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    // Weekly cleanup on Sunday at 3 AM
    const cleanupJob = cron.schedule('0 3 * * 0', async () => {
      logger.info('Starting scheduled job cleanup');
      
      try {
        await jobScraperManager.cleanupOldJobs(60);
        logger.info('Scheduled cleanup completed');
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.push(dailyJob, cleanupJob);
    this.isRunning = true;

    logger.info('Scraper scheduler started - Daily scraping at 2 AM IST, Weekly cleanup on Sunday 3 AM IST');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Scraper scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length
    };
  }
}

// Create singleton instance
const scraperScheduler = new ScraperScheduler();

// Auto-start if enabled in env
if (process.env.SCRAPING_ENABLED === 'true' && process.env.NODE_ENV !== 'test') {
  scraperScheduler.start();
}

module.exports = scraperScheduler;