const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const ExternalJob = require('../models/ExternalJob');
const logger = require('../config/logger');

class JobScraperService {
  constructor() {
    this.browser = null;
    this.maxRetries = 3;
    this.rateLimitDelay = 5000; // 5 seconds between requests
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
      logger.info('Browser initialized for scraping');
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  /**
   * Get random user agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Delay execution
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape jobs from Indeed
   */
  async scrapeIndeed(searchQuery = 'software developer', location = 'Karnataka', maxPages = 3) {
    logger.info(`Starting Indeed scraping: ${searchQuery} in ${location}`);
    const jobs = [];

    try {
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        try {
          const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(location)}&start=${pageNum * 10}`;
          
          logger.info(`Scraping Indeed page ${pageNum + 1}: ${url}`);
          
          await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });

          // Wait for job listings to load
          await page.waitForSelector('.job_seen_beacon, .resultContent', { timeout: 10000 }).catch(() => {});

          // Extract job data
          const pageJobs = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('.job_seen_beacon');
            const extractedJobs = [];

            jobElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('h2.jobTitle a, h2.jobTitle span');
                const companyElement = element.querySelector('[data-testid="company-name"], .companyName');
                const locationElement = element.querySelector('[data-testid="text-location"], .companyLocation');
                const summaryElement = element.querySelector('.job-snippet, .jobCardShelfContainer');
                const salaryElement = element.querySelector('.salary-snippet, .metadata.salary-snippet-container');
                const jobKeyElement = element.querySelector('a[data-jk], h2[data-jk]');

                if (titleElement && companyElement) {
                  const jobKey = jobKeyElement?.getAttribute('data-jk') || 
                                jobKeyElement?.closest('[data-jk]')?.getAttribute('data-jk') ||
                                element.getAttribute('data-jk') || 
                                Math.random().toString(36).substr(2, 9);

                  extractedJobs.push({
                    title: titleElement.innerText?.trim() || '',
                    company: companyElement.innerText?.trim() || '',
                    location: locationElement?.innerText?.trim() || '',
                    summary: summaryElement?.innerText?.trim() || '',
                    salaryText: salaryElement?.innerText?.trim() || null,
                    externalId: jobKey,
                    externalUrl: `https://in.indeed.com/viewjob?jk=${jobKey}`
                  });
                }
              } catch (err) {
                console.error('Error extracting job:', err);
              }
            });

            return extractedJobs;
          });

          logger.info(`Extracted ${pageJobs.length} jobs from Indeed page ${pageNum + 1}`);
          jobs.push(...pageJobs);

          // Rate limiting delay
          await this.delay(this.rateLimitDelay);

        } catch (pageError) {
          logger.error(`Error scraping Indeed page ${pageNum + 1}:`, pageError);
        }
      }

      await page.close();

    } catch (error) {
      logger.error('Indeed scraping error:', error);
    }

    return jobs;
  }

  /**
   * Scrape jobs from LinkedIn (simplified approach using public search)
   */
  async scrapeLinkedIn(searchQuery = 'software developer', location = 'Karnataka', maxPages = 2) {
    logger.info(`Starting LinkedIn scraping: ${searchQuery} in ${location}`);
    const jobs = [];

    try {
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        try {
          const start = pageNum * 25;
          const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&start=${start}`;
          
          logger.info(`Scraping LinkedIn page ${pageNum + 1}: ${url}`);
          
          await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });

          // Wait for job cards to load
          await page.waitForSelector('.base-card, .job-search-card', { timeout: 10000 }).catch(() => {});

          // Scroll to load more jobs
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await this.delay(2000);

          // Extract job data
          const pageJobs = await page.evaluate(() => {
            const jobCards = document.querySelectorAll('.base-card, .job-search-card');
            const extractedJobs = [];

            jobCards.forEach((card) => {
              try {
                const titleElement = card.querySelector('.base-search-card__title, h3.base-search-card__title');
                const companyElement = card.querySelector('.base-search-card__subtitle, h4.base-search-card__subtitle');
                const locationElement = card.querySelector('.job-search-card__location, span.job-search-card__location');
                const linkElement = card.querySelector('a.base-card__full-link');

                if (titleElement && companyElement && linkElement) {
                  const jobUrl = linkElement.href;
                  const jobId = jobUrl.match(/jobs\/view\/(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9);

                  extractedJobs.push({
                    title: titleElement.innerText?.trim() || '',
                    company: companyElement.innerText?.trim() || '',
                    location: locationElement?.innerText?.trim() || '',
                    externalId: jobId,
                    externalUrl: jobUrl
                  });
                }
              } catch (err) {
                console.error('Error extracting LinkedIn job:', err);
              }
            });

            return extractedJobs;
          });

          logger.info(`Extracted ${pageJobs.length} jobs from LinkedIn page ${pageNum + 1}`);
          jobs.push(...pageJobs);

          // Rate limiting delay (longer for LinkedIn)
          await this.delay(this.rateLimitDelay * 2);

        } catch (pageError) {
          logger.error(`Error scraping LinkedIn page ${pageNum + 1}:`, pageError);
        }
      }

      await page.close();

    } catch (error) {
      logger.error('LinkedIn scraping error:', error);
    }

    return jobs;
  }

  /**
   * Parse salary text to structured data
   */
  parseSalary(salaryText) {
    if (!salaryText) return null;

    const salary = {
      text: salaryText,
      currency: 'INR',
      period: 'annual'
    };

    // Extract salary range
    const rangeMatch = salaryText.match(/₹?([\d,]+)\s*-\s*₹?([\d,]+)/);
    if (rangeMatch) {
      salary.min = parseInt(rangeMatch[1].replace(/,/g, ''));
      salary.max = parseInt(rangeMatch[2].replace(/,/g, ''));
    }

    // Detect period
    if (salaryText.toLowerCase().includes('month')) {
      salary.period = 'monthly';
    } else if (salaryText.toLowerCase().includes('hour')) {
      salary.period = 'hourly';
    }

    // Detect currency
    if (salaryText.includes('$')) {
      salary.currency = 'USD';
    } else if (salaryText.includes('£')) {
      salary.currency = 'GBP';
    }

    return salary;
  }

  /**
   * Extract skills from job description
   */
  extractSkills(text) {
    if (!text) return [];

    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
      'SQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git',
      'HTML', 'CSS', 'TypeScript', 'PHP', 'C++', 'C#', '.NET',
      'Spring', 'Django', 'Flask', 'Express', 'REST', 'GraphQL',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Agile', 'Scrum'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)];
  }

  /**
   * Parse location to structured format
   */
  parseLocation(locationString) {
    if (!locationString) return null;

    const parts = locationString.split(',').map(p => p.trim());
    
    return {
      city: parts[0] || null,
      state: parts[1] || 'Karnataka',
      country: 'India'
    };
  }

  /**
   * Save scraped jobs to database
   */
  async saveJobs(jobs, source) {
    logger.info(`Saving ${jobs.length} jobs from ${source} to database`);
    
    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const jobData of jobs) {
      try {
        // Check if job already exists
        const existing = await ExternalJob.findOne({
          source,
          externalId: jobData.externalId
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        // Prepare job document
        const jobDoc = {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description || jobData.summary || '',
          summary: jobData.summary || '',
          source,
          externalId: jobData.externalId,
          externalUrl: jobData.externalUrl,
          salary: this.parseSalary(jobData.salaryText),
          requiredSkills: this.extractSkills(jobData.description || jobData.summary),
          parsedLocation: this.parseLocation(jobData.location),
          scrapedAt: new Date(),
          status: 'active'
        };

        // Create and save job
        const job = new ExternalJob(jobDoc);
        
        // Calculate quality score
        job.calculateQualityScore();
        
        await job.save();
        savedCount++;

        logger.debug(`Saved job: ${jobData.title} at ${jobData.company}`);

      } catch (error) {
        errorCount++;
        logger.error(`Error saving job ${jobData.title}:`, error.message);
      }
    }

    logger.info(`Job saving complete - Saved: ${savedCount}, Duplicates: ${duplicateCount}, Errors: ${errorCount}`);

    return {
      total: jobs.length,
      saved: savedCount,
      duplicates: duplicateCount,
      errors: errorCount
    };
  }

  /**
   * Main scraping orchestrator
   */
  async scrapeAll(config = {}) {
    const {
      searchQueries = ['software developer', 'web developer', 'data analyst'],
      location = 'Karnataka',
      sources = ['indeed', 'linkedin'],
      maxPagesPerQuery = 2
    } = config;

    logger.info('Starting job scraping session', { searchQueries, location, sources });

    const results = {
      indeed: { scraped: 0, saved: 0, duplicates: 0, errors: 0 },
      linkedin: { scraped: 0, saved: 0, duplicates: 0, errors: 0 }
    };

    try {
      await this.initBrowser();

      for (const query of searchQueries) {
        logger.info(`Processing search query: "${query}"`);

        // Scrape Indeed
        if (sources.includes('indeed')) {
          try {
            const indeedJobs = await this.scrapeIndeed(query, location, maxPagesPerQuery);
            const saveResults = await this.saveJobs(indeedJobs, 'indeed');
            
            results.indeed.scraped += indeedJobs.length;
            results.indeed.saved += saveResults.saved;
            results.indeed.duplicates += saveResults.duplicates;
            results.indeed.errors += saveResults.errors;

          } catch (error) {
            logger.error(`Error scraping Indeed for "${query}":`, error);
          }
        }

        // Scrape LinkedIn
        if (sources.includes('linkedin')) {
          try {
            const linkedinJobs = await this.scrapeLinkedIn(query, location, maxPagesPerQuery);
            const saveResults = await this.saveJobs(linkedinJobs, 'linkedin');
            
            results.linkedin.scraped += linkedinJobs.length;
            results.linkedin.saved += saveResults.saved;
            results.linkedin.duplicates += saveResults.duplicates;
            results.linkedin.errors += saveResults.errors;

          } catch (error) {
            logger.error(`Error scraping LinkedIn for "${query}":`, error);
          }
        }

        // Delay between queries
        await this.delay(this.rateLimitDelay);
      }

    } catch (error) {
      logger.error('Scraping session error:', error);
    } finally {
      await this.closeBrowser();
    }

    logger.info('Scraping session complete', results);
    return results;
  }

  /**
   * Clean up old scraped jobs
   */
  async cleanupOldJobs(daysOld = 60) {
    logger.info(`Cleaning up jobs older than ${daysOld} days`);
    
    try {
      const result = await ExternalJob.cleanupExpired();
      logger.info(`Cleanup complete: ${result.modifiedCount} jobs marked as expired`);
      return result;
    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const jobScraper = new JobScraperService();

module.exports = jobScraper;