const ExternalJob = require('../models/ExternalJob');
const logger = require('../config/logger');
const indeedScraper = require('./scrapers/indeedScraper');
const naukriScraper = require('./scrapers/naukriScraper');
const linkedinScraper = require('./scrapers/linkedinScraper');
const crypto = require('crypto');

class JobScraperManager {
  constructor() {
    this.scrapers = {
      indeed: indeedScraper,
      naukri: naukriScraper,
      linkedin: linkedinScraper
    };
    this.sessionId = null;
  }

  /**
   * Scrape jobs from multiple sources
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraping results
   */
  async scrapeJobs(options = {}) {
    const {
      sources = ['indeed', 'naukri', 'linkedin'],
      query = 'software developer',
      location = 'Karnataka',
      limit = 50,
      saveToDb = true
    } = options;

    this.sessionId = this.generateSessionId();
    const startTime = Date.now();

    logger.info(`Starting scraping session ${this.sessionId}`, {
      sources,
      query,
      location,
      limit
    });

    const results = {
      sessionId: this.sessionId,
      startTime: new Date(startTime),
      sources: {},
      summary: {
        totalJobsScraped: 0,
        totalJobsSaved: 0,
        totalDuplicates: 0,
        totalErrors: 0
      }
    };

    // Scrape from each source
    for (const source of sources) {
      if (!this.scrapers[source]) {
        logger.warn(`Unknown scraper source: ${source}`);
        continue;
      }

      try {
        logger.info(`Scraping from ${source}...`);
        
        const sourceResults = await this.scrapeFromSource(
          source,
          { query, location, limit: Math.ceil(limit / sources.length) }
        );

        results.sources[source] = sourceResults;
        results.summary.totalJobsScraped += sourceResults.jobsScraped;
        results.summary.totalJobsSaved += sourceResults.jobsSaved;
        results.summary.totalDuplicates += sourceResults.duplicates;
        results.summary.totalErrors += sourceResults.errors;

      } catch (error) {
        logger.error(`Error scraping from ${source}:`, error);
        results.sources[source] = {
          jobsScraped: 0,
          jobsSaved: 0,
          duplicates: 0,
          errors: 1,
          error: error.message
        };
        results.summary.totalErrors++;
      }
    }

    const endTime = Date.now();
    results.endTime = new Date(endTime);
    results.duration = endTime - startTime;

    logger.info(`Scraping session ${this.sessionId} completed`, results.summary);

    return results;
  }

  /**
   * Scrape from a single source
   */
  async scrapeFromSource(source, options) {
    const sourceResults = {
      source,
      jobsScraped: 0,
      jobsSaved: 0,
      duplicates: 0,
      errors: 0,
      jobs: []
    };

    try {
      // Call the appropriate scraper
      const scraper = this.scrapers[source];
      const jobs = await scraper.scrapeJobs(options);

      sourceResults.jobsScraped = jobs.length;

      // Save jobs to database
      for (const jobData of jobs) {
        try {
          const savedJob = await this.saveJob(jobData, source);
          
          if (savedJob.isDuplicate) {
            sourceResults.duplicates++;
          } else {
            sourceResults.jobsSaved++;
            sourceResults.jobs.push(savedJob.job);
          }
        } catch (saveError) {
          logger.warn(`Error saving job from ${source}:`, saveError.message);
          sourceResults.errors++;
        }
      }

    } catch (error) {
      logger.error(`Scraping error for ${source}:`, error);
      sourceResults.errors++;
      throw error;
    }

    return sourceResults;
  }

  /**
   * Save job to database
   */
  async saveJob(jobData, source) {
    try {
      // Check for duplicate by externalId and source
      const existing = await ExternalJob.findOne({
        source: source,
        externalId: jobData.externalId
      });

      if (existing) {
        // Update existing job
        Object.assign(existing, {
          ...jobData,
          scrapedAt: new Date(),
          lastUpdated: new Date(),
          scrapingSession: this.sessionId
        });
        
        await existing.save();
        
        logger.debug(`Updated existing job: ${jobData.title} from ${source}`);
        
        return {
          isDuplicate: true,
          job: existing
        };
      }

      // Create content hash for duplicate detection across sources
      const contentHash = this.generateContentHash(
        jobData.title,
        jobData.company,
        jobData.location
      );

      // Check for cross-source duplicates
      const duplicateAcrossSources = await ExternalJob.findOne({
        contentHash,
        source: { $ne: source }
      });

      const newJob = new ExternalJob({
        ...jobData,
        source,
        contentHash,
        scrapedAt: new Date(),
        scrapingSession: this.sessionId,
        status: 'active'
      });

      // Calculate quality score
      newJob.calculateQualityScore();

      // Parse location if available
      if (jobData.location) {
        newJob.parsedLocation = this.parseLocation(jobData.location);
      }

      await newJob.save();

      logger.info(`Saved new job: ${jobData.title} from ${source}`);

      return {
        isDuplicate: false,
        job: newJob
      };

    } catch (error) {
      logger.error('Error saving job:', error);
      throw error;
    }
  }

  /**
   * Generate content hash for duplicate detection
   */
  generateContentHash(title, company, location) {
    const content = `${title}|${company}|${location}`.toLowerCase();
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Parse location string into components
   */
  parseLocation(locationString) {
    const location = {
      city: null,
      state: null,
      country: 'India'
    };

    // Common Karnataka cities
    const cities = [
      'bangalore', 'bengaluru', 'mysore', 'mangalore', 'hubli', 
      'belgaum', 'davangere', 'bellary', 'bijapur', 'tumkur'
    ];

    const lowerLocation = locationString.toLowerCase();

    // Extract city
    for (const city of cities) {
      if (lowerLocation.includes(city)) {
        location.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // Check for Karnataka
    if (lowerLocation.includes('karnataka')) {
      location.state = 'Karnataka';
    }

    return location;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const stats = await ExternalJob.aggregate([
        {
          $match: {
            scrapedAt: { $gte: cutoffDate }
          }
        },
        {
          $group: {
            _id: '$source',
            totalJobs: { $sum: 1 },
            activeJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            avgQualityScore: { $avg: '$qualityScore' },
            lastScraped: { $max: '$scrapedAt' }
          }
        }
      ]);

      const totalStats = await ExternalJob.countDocuments({
        scrapedAt: { $gte: cutoffDate }
      });

      return {
        period: `Last ${days} days`,
        totalJobs: totalStats,
        bySource: stats,
        generated: new Date()
      };

    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup old jobs
   */
  async cleanupOldJobs(daysOld = 60) {
    try {
      const result = await ExternalJob.cleanupExpired();
      
      logger.info(`Cleaned up ${result.modifiedCount} expired jobs`);
      
      return {
        success: true,
        jobsCleaned: result.modifiedCount
      };

    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(options = {}) {
    const {
      source = null,
      limit = 20,
      status = 'active',
      days = 7
    } = options;

    try {
      const query = { status };

      if (source) {
        query.source = source;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query.scrapedAt = { $gte: cutoffDate };

      const jobs = await ExternalJob.find(query)
        .sort({ scrapedAt: -1 })
        .limit(limit)
        .select('-rawData -contentHash');

      return jobs;

    } catch (error) {
      logger.error('Error getting recent jobs:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new JobScraperManager();
