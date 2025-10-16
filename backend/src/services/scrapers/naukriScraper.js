const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../config/logger');

class NaukriScraper {
  constructor() {
    this.baseUrl = 'https://www.naukri.com';
    this.searchUrl = `${this.baseUrl}`;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape jobs from Naukri
   * @param {Object} options - Search parameters
   * @returns {Promise<Array>} Array of scraped job objects
   */
  async scrapeJobs(options = {}) {
    const {
      query = 'software developer',
      location = 'karnataka',
      experience = '',
      maxPages = 2,
      limit = 50
    } = options;

    try {
      logger.info(`Starting Naukri scraper: query="${query}", location="${location}"`);
      
      const jobs = [];
      let page = 1;
      
      while (page <= maxPages && jobs.length < limit) {
        // Naukri URL structure: naukri.com/query-location-jobs-page
        const searchQuery = query.toLowerCase().replace(/\s+/g, '-');
        const searchLocation = location.toLowerCase().replace(/\s+/g, '-');
        const url = `${this.baseUrl}/${searchQuery}-jobs-in-${searchLocation}-${page}`;
        
        logger.info(`Scraping Naukri page ${page}: ${url}`);

        try {
          const html = await this.fetchPage(url);
          const pageJobs = this.parseJobListings(html);
          
          if (pageJobs.length === 0) {
            logger.info('No more jobs found on this page, stopping scraping');
            break;
          }

          jobs.push(...pageJobs.slice(0, limit - jobs.length));
          
          logger.info(`Found ${pageJobs.length} jobs on page ${page}`);
          
          page++;
          
          // Rate limiting between pages
          await this.delay(2000 + Math.random() * 2000);
        } catch (error) {
          logger.error(`Error scraping page ${page}: ${error.message}`);
          break;
        }
      }

      logger.info(`Naukri scraping completed: ${jobs.length} jobs scraped`);
      return jobs;

    } catch (error) {
      logger.error('Naukri scraping failed:', error);
      throw new Error(`Naukri scraping failed: ${error.message}`);
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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': this.baseUrl,
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch page ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse job listings from search results page
   */
  parseJobListings(html) {
    const $ = cheerio.load(html);
    const jobs = [];

    // Naukri uses article.jobTuple for job listings
    $('article.jobTuple, div.srp-jobtuple-wrapper article').each((i, element) => {
      try {
        const $job = $(element);
        
        // Extract job ID
        const jobId = $job.attr('data-job-id') || $job.find('[data-job-id]').attr('data-job-id');
        if (!jobId) return;

        // Title and URL
        const titleElement = $job.find('.title a, a.title');
        const title = titleElement.text().trim();
        let jobUrl = titleElement.attr('href');
        if (jobUrl && !jobUrl.startsWith('http')) {
          jobUrl = `${this.baseUrl}${jobUrl}`;
        }

        // Company
        const company = $job.find('.comp-name, .companyInfo a.subTitle').text().trim();
        
        // Experience
        const experience = $job.find('.expwdth, .experience').text().trim();
        
        // Salary
        const salary = $job.find('.sal, .salary').text().trim();
        
        // Location
        const location = $job.find('.locWdth, .location .ellipsis').text().trim();
        
        // Description/Summary
        const description = $job.find('.job-description, .desc').text().trim();
        
        // Skills
        const skills = [];
        $job.find('.tag-li, .tags li').each((j, tag) => {
          const skill = $(tag).text().trim();
          if (skill) skills.push(skill);
        });

        // Posted date
        const postedText = $job.find('.job-post-day, .fleft.postedDate').text().trim();
        const postedDate = this.parsePostedDate(postedText);

        if (title && jobId) {
          jobs.push({
            title,
            company: company || 'Unknown Company',
            location: location || 'Not specified',
            description,
            summary: description.substring(0, 1000),
            experience,
            salaryText: salary,
            salary: this.parseSalary(salary),
            requiredSkills: skills,
            externalId: jobId,
            externalUrl: jobUrl || `${this.baseUrl}/job-listings-${jobId}`,
            source: 'naukri',
            postedDate,
            scrapedAt: new Date()
          });
        }
      } catch (error) {
        logger.warn(`Error parsing Naukri job listing: ${error.message}`);
      }
    });

    return jobs;
  }

  /**
   * Parse salary from text
   */
  parseSalary(text) {
    if (!text || text.toLowerCase() === 'not disclosed') return null;

    const salary = {
      text: text,
      currency: 'INR',
      period: 'annual'
    };

    // Naukri format: "5-8 Lacs P.A." or "50,000-80,000 per month"
    const lakhRangeMatch = text.match(/([\d.]+)\s*-\s*([\d.]+)\s*(?:Lacs?|LPA|Lakhs?)/i);
    const monthlyMatch = text.match(/([\d,]+)\s*-\s*([\d,]+)\s*(?:per month|month)/i);
    
    if (lakhRangeMatch) {
      salary.min = parseFloat(lakhRangeMatch[1]) * 100000;
      salary.max = parseFloat(lakhRangeMatch[2]) * 100000;
      salary.period = 'annual';
    } else if (monthlyMatch) {
      salary.min = parseFloat(monthlyMatch[1].replace(/,/g, ''));
      salary.max = parseFloat(monthlyMatch[2].replace(/,/g, ''));
      salary.period = 'monthly';
    }

    return salary;
  }

  /**
   * Parse posted date from text
   */
  parsePostedDate(text) {
    if (!text) return null;

    const daysMatch = text.match(/(\d+)\s*days?\s*ago/i);
    const hoursMatch = text.match(/(\d+)\s*hours?\s*ago/i);
    const todayMatch = /today|few hours ago/i.test(text);

    const date = new Date();

    if (todayMatch) {
      return date;
    } else if (hoursMatch) {
      date.setHours(date.getHours() - parseInt(hoursMatch[1]));
      return date;
    } else if (daysMatch) {
      date.setDate(date.getDate() - parseInt(daysMatch[1]));
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

module.exports = new NaukriScraper();
