const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../config/logger');

class IndeedScraper {
  constructor() {
    this.baseUrl = 'https://in.indeed.com';
    this.searchUrl = `${this.baseUrl}/jobs`;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape jobs from Indeed
   * @param {Object} options - Search parameters
   * @returns {Promise<Array>} Array of scraped job objects
   */
  async scrapeJobs(options = {}) {
    const {
      query = 'software developer',
      location = 'Karnataka',
      maxPages = 3,
      limit = 50
    } = options;

    try {
      logger.info(`Starting Indeed scraper: query="${query}", location="${location}"`);
      
      const jobs = [];
      let page = 0;
      
      while (page < maxPages && jobs.length < limit) {
        const start = page * 10; // Indeed shows 10 results per page
        const searchParams = new URLSearchParams({
          q: query,
          l: location,
          start: start.toString(),
          filter: '0', // No duplicates
          sort: 'date' // Sort by date
        });

        const url = `${this.searchUrl}?${searchParams.toString()}`;
        logger.info(`Scraping Indeed page ${page + 1}: ${url}`);

        try {
          const html = await this.fetchPage(url);
          const pageJobs = this.parseJobListings(html);
          
          if (pageJobs.length === 0) {
            logger.info('No more jobs found on this page, stopping scraping');
            break;
          }

          // Get details for each job
          for (const job of pageJobs) {
            if (jobs.length >= limit) break;
            
            try {
              const detailedJob = await this.scrapeJobDetails(job);
              if (detailedJob) {
                jobs.push(detailedJob);
                logger.info(`Scraped job: ${detailedJob.title} at ${detailedJob.company}`);
              }
              
              // Rate limiting - wait 1-2 seconds between requests
              await this.delay(1000 + Math.random() * 1000);
            } catch (error) {
              logger.warn(`Failed to get job details: ${error.message}`);
            }
          }

          page++;
          
          // Rate limiting between pages
          await this.delay(2000 + Math.random() * 1000);
        } catch (error) {
          logger.error(`Error scraping page ${page + 1}: ${error.message}`);
          break;
        }
      }

      logger.info(`Indeed scraping completed: ${jobs.length} jobs scraped`);
      return jobs;

    } catch (error) {
      logger.error('Indeed scraping failed:', error);
      throw new Error(`Indeed scraping failed: ${error.message}`);
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

    // Indeed uses mosaic provider cards for job listings
    $('.job_seen_beacon, .jobsearch-ResultsList li').each((i, element) => {
      try {
        const $job = $(element);
        
        // Extract job key/ID
        const jobKey = $job.attr('data-jk') || $job.find('[data-jk]').attr('data-jk');
        if (!jobKey) return;

        const titleElement = $job.find('.jobTitle a, h2.jobTitle a');
        const title = titleElement.text().trim();
        const jobUrl = titleElement.attr('href');

        const company = $job.find('.companyName').text().trim();
        const location = $job.find('.companyLocation').text().trim();
        const summary = $job.find('.job-snippet').text().trim();
        
        // Extract salary if available
        const salaryText = $job.find('.salary-snippet').text().trim();

        if (title && jobKey) {
          jobs.push({
            externalId: jobKey,
            title,
            company: company || 'Unknown Company',
            location: location || 'Not specified',
            summary,
            salaryText,
            externalUrl: jobUrl ? `${this.baseUrl}${jobUrl}` : `${this.baseUrl}/viewjob?jk=${jobKey}`,
            source: 'indeed'
          });
        }
      } catch (error) {
        logger.warn(`Error parsing job listing: ${error.message}`);
      }
    });

    return jobs;
  }

  /**
   * Scrape detailed job information
   */
  async scrapeJobDetails(job) {
    try {
      const html = await this.fetchPage(job.externalUrl);
      const $ = cheerio.load(html);

      // Extract detailed information
      const description = $('#jobDescriptionText').text().trim() || job.summary;
      
      // Extract job type
      let jobType = 'unknown';
      const jobTypeText = $('.jobsearch-JobMetadataHeader-item').text().toLowerCase();
      if (jobTypeText.includes('full-time') || jobTypeText.includes('full time')) jobType = 'full-time';
      else if (jobTypeText.includes('part-time') || jobTypeText.includes('part time')) jobType = 'part-time';
      else if (jobTypeText.includes('contract')) jobType = 'contract';
      else if (jobTypeText.includes('internship')) jobType = 'internship';
      else if (jobTypeText.includes('temporary')) jobType = 'temporary';

      // Extract work mode
      let workMode = 'unknown';
      const descLower = description.toLowerCase();
      if (descLower.includes('remote')) workMode = 'remote';
      else if (descLower.includes('hybrid')) workMode = 'hybrid';
      else if (descLower.includes('on-site') || descLower.includes('onsite') || descLower.includes('office')) workMode = 'onsite';

      // Extract salary
      const salary = this.parseSalary(job.salaryText || $('.salary-snippet, .icl-u-xs-mr--xs').text().trim());

      // Extract skills from description (basic keyword matching)
      const skills = this.extractSkills(description);

      // Extract posted date
      const postedText = $('.jobsearch-JobMetadataFooter').text();
      const postedDate = this.parsePostedDate(postedText);

      return {
        title: job.title,
        company: job.company,
        location: job.location,
        description: description.substring(0, 10000), // Limit to 10k chars
        summary: job.summary || description.substring(0, 1000),
        source: 'indeed',
        externalId: job.externalId,
        externalUrl: job.externalUrl,
        jobType,
        workMode,
        salary,
        requiredSkills: skills,
        postedDate,
        scrapedAt: new Date()
      };

    } catch (error) {
      logger.warn(`Failed to scrape job details for ${job.externalId}: ${error.message}`);
      // Return basic job info if detailed scraping fails
      return {
        ...job,
        description: job.summary,
        scrapedAt: new Date()
      };
    }
  }

  /**
   * Parse salary from text
   */
  parseSalary(text) {
    if (!text) return null;

    const salary = {
      text: text,
      currency: 'INR',
      period: 'annual'
    };

    // Extract numbers (handle lakhs and thousands)
    const lakhMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(?:L|Lakh|Lakhs)/i);
    const thousandMatch = text.match(/([\d,]+)(?:,000)/);
    const rangeMatch = text.match(/₹?\s*([\d,]+(?:\.\d+)?)\s*(?:L|Lakh)?\s*-\s*₹?\s*([\d,]+(?:\.\d+)?)\s*(?:L|Lakh)?/i);

    if (rangeMatch) {
      // Range like "5L - 8L" or "50,000 - 80,000"
      salary.min = this.parseSalaryValue(rangeMatch[1], text);
      salary.max = this.parseSalaryValue(rangeMatch[2], text);
    } else if (lakhMatch) {
      const value = parseFloat(lakhMatch[1].replace(/,/g, '')) * 100000;
      salary.min = value * 0.9; // Estimate range
      salary.max = value * 1.1;
    } else if (thousandMatch) {
      const value = parseFloat(thousandMatch[1].replace(/,/g, '')) * 1000;
      salary.min = value * 0.9;
      salary.max = value * 1.1;
    }

    // Determine period
    if (text.toLowerCase().includes('month')) salary.period = 'monthly';
    else if (text.toLowerCase().includes('hour')) salary.period = 'hourly';

    return salary;
  }

  parseSalaryValue(text, fullText) {
    const value = parseFloat(text.replace(/,/g, ''));
    // If text mentions lakhs or value is less than 100, assume it's in lakhs
    if (fullText.toLowerCase().includes('lakh') || value < 100) {
      return value * 100000;
    }
    return value;
  }

  /**
   * Extract skills from description using keyword matching
   */
  extractSkills(text) {
    const skillKeywords = [
      // Programming Languages
      'javascript', 'java', 'python', 'c\\+\\+', 'c#', 'php', 'ruby', 'swift', 'kotlin', 
      'typescript', 'golang', 'rust', 'scala', 'r',
      
      // Frontend
      'react', 'angular', 'vue', 'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
      'jquery', 'webpack', 'redux', 'next\\.js', 'nuxt',
      
      // Backend
      'node\\.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', '.net',
      'fastapi', 'nest\\.js',
      
      // Databases
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
      'oracle', 'sqlite', 'dynamodb',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform',
      'ansible', 'linux', 'git', 'github', 'gitlab',
      
      // Mobile
      'android', 'ios', 'react native', 'flutter', 'xamarin',
      
      // Other Tech
      'machine learning', 'ai', 'data science', 'big data', 'spark', 'hadoop',
      'microservices', 'rest api', 'graphql', 'agile', 'scrum', 'jira'
    ];

    const skills = [];
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        // Capitalize properly
        const skill = keyword.replace(/\\b/g, '').replace(/\\\./g, '.')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        skills.push(skill);
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Parse posted date from text like "Posted 3 days ago"
   */
  parsePostedDate(text) {
    if (!text) return null;

    const daysMatch = text.match(/(\d+)\s*days?\s*ago/i);
    const hoursMatch = text.match(/(\d+)\s*hours?\s*ago/i);
    const todayMatch = /today|just posted/i.test(text);

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

module.exports = new IndeedScraper();
