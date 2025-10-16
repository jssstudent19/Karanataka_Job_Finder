const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../config/logger');

class LinkedInScraper {
  constructor() {
    this.baseUrl = 'https://www.linkedin.com';
    this.jobsUrl = `${this.baseUrl}/jobs-guest/jobs/api/seeMoreJobPostings/search`;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape jobs from LinkedIn (public jobs only)
   * @param {Object} options - Search parameters
   * @returns {Promise<Array>} Array of scraped job objects
   */
  async scrapeJobs(options = {}) {
    const {
      query = 'software developer',
      location = 'Karnataka, India',
      maxJobs = 25,
      limit = 50
    } = options;

    try {
      logger.info(`Starting LinkedIn scraper: query="${query}", location="${location}"`);
      
      const jobs = [];
      let start = 0;
      const count = 25; // LinkedIn shows 25 jobs per request
      
      while (jobs.length < limit && start < maxJobs) {
        const params = {
          keywords: query,
          location: location,
          start: start,
          count: count,
          f_TPR: 'r604800' // Jobs posted in last 7 days
        };

        const url = `${this.jobsUrl}?${new URLSearchParams(params).toString()}`;
        logger.info(`Scraping LinkedIn jobs: start=${start}`);

        try {
          const html = await this.fetchPage(url);
          const pageJobs = this.parseJobListings(html);
          
          if (pageJobs.length === 0) {
            logger.info('No more jobs found, stopping scraping');
            break;
          }

          jobs.push(...pageJobs.slice(0, limit - jobs.length));
          logger.info(`Found ${pageJobs.length} jobs`);
          
          start += count;
          
          // Rate limiting
          await this.delay(3000 + Math.random() * 2000);
        } catch (error) {
          logger.error(`Error scraping LinkedIn: ${error.message}`);
          break;
        }
      }

      logger.info(`LinkedIn scraping completed: ${jobs.length} jobs scraped`);
      return jobs;

    } catch (error) {
      logger.error('LinkedIn scraping failed:', error);
      throw new Error(`LinkedIn scraping failed: ${error.message}`);
    }
  }

  /**
   * Fetch page content
   */
  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `${this.baseUrl}/jobs/search/`,
          'Connection': 'keep-alive'
        },
        timeout: 20000,
        maxRedirects: 5
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch LinkedIn page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse job listings from HTML
   */
  parseJobListings(html) {
    const $ = cheerio.load(html);
    const jobs = [];

    $('li').each((i, element) => {
      try {
        const $job = $(element);
        
        // Extract job ID from data-entity-urn or job link
        const jobId = this.extractJobId($job);
        if (!jobId) return;

        // Title
        const title = $job.find('.base-search-card__title').text().trim();
        if (!title) return;

        // Company
        const company = $job.find('.base-search-card__subtitle').text().trim();
        
        // Location
        const location = $job.find('.job-search-card__location').text().trim();
        
        // Job link
        const jobLink = $job.find('.base-card__full-link').attr('href');
        
        // Posted date
        const postedText = $job.find('time').attr('datetime') || $job.find('.job-search-card__listdate').text().trim();
        const postedDate = this.parsePostedDate(postedText);

        if (title && jobId) {
          jobs.push({
            title,
            company: company || 'Unknown Company',
            location: location || 'Not specified',
            externalId: jobId,
            externalUrl: jobLink || `${this.baseUrl}/jobs/view/${jobId}`,
            source: 'linkedin',
            postedDate,
            scrapedAt: new Date()
          });
        }
      } catch (error) {
        logger.warn(`Error parsing LinkedIn job listing: ${error.message}`);
      }
    });

    return jobs;
  }

  /**
   * Extract job ID from various sources
   */
  extractJobId($element) {
    // Try data-entity-urn
    const entityUrn = $element.attr('data-entity-urn');
    if (entityUrn) {
      const match = entityUrn.match(/(\d+)$/);
      if (match) return match[1];
    }

    // Try job link
    const jobLink = $element.find('a.base-card__full-link, a[href*="/jobs/view/"]').attr('href');
    if (jobLink) {
      const match = jobLink.match(/jobs\/view\/(\d+)/);
      if (match) return match[1];
    }

    // Try data-job-id
    const dataJobId = $element.attr('data-job-id') || $element.find('[data-job-id]').attr('data-job-id');
    if (dataJobId) return dataJobId;

    return null;
  }

  /**
   * Parse posted date
   */
  parsePostedDate(text) {
    if (!text) return null;

    // Try ISO date first (datetime attribute)
    try {
      const date = new Date(text);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      // Continue with text parsing
    }

    const daysMatch = text.match(/(\d+)\s*days?\s*ago/i);
    const weeksMatch = text.match(/(\d+)\s*weeks?\s*ago/i);
    const hoursMatch = text.match(/(\d+)\s*hours?\s*ago/i);
    const minutesMatch = text.match(/(\d+)\s*minutes?\s*ago/i);

    const date = new Date();

    if (minutesMatch) {
      date.setMinutes(date.getMinutes() - parseInt(minutesMatch[1]));
      return date;
    } else if (hoursMatch) {
      date.setHours(date.getHours() - parseInt(hoursMatch[1]));
      return date;
    } else if (daysMatch) {
      date.setDate(date.getDate() - parseInt(daysMatch[1]));
      return date;
    } else if (weeksMatch) {
      date.setDate(date.getDate() - parseInt(weeksMatch[1]) * 7);
      return date;
    }

    return null;
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new LinkedInScraper();
