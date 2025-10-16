const axios = require('axios');
const logger = require('../../config/logger');

class AdzunaScraper {
  constructor() {
    // Get credentials from .env
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.baseUrl = 'https://api.adzuna.com/v1/api/jobs';
    this.country = 'in'; // India
  }

  /**
   * Fetch jobs from Adzuna API
   * @param {Object} options - Search parameters
   * @returns {Promise<Array>} Array of job objects
   */
  async scrapeJobs(options = {}) {
    const {
      query = 'software developer',
      location = 'bangalore',
      maxPages = 2,
      limit = 50
    } = options;

    // Check if API credentials are configured
    if (!this.appId || !this.appKey) {
      logger.warn('Adzuna API credentials not configured. Skipping Adzuna scraper.');
      return [];
    }

    try {
      logger.info(`Starting Adzuna API fetch: query="${query}", location="${location}"`);
      
      const jobs = [];
      const resultsPerPage = 25; // Adzuna max
      const pagesToFetch = Math.min(maxPages, Math.ceil(limit / resultsPerPage));
      
      for (let page = 1; page <= pagesToFetch; page++) {
        if (jobs.length >= limit) break;

        try {
          const pageJobs = await this.fetchPage(query, location, page, resultsPerPage);
          
          if (pageJobs.length === 0) {
            logger.info('No more jobs from Adzuna, stopping');
            break;
          }

          jobs.push(...pageJobs);
          logger.info(`Fetched ${pageJobs.length} jobs from Adzuna page ${page}`);

          // Rate limiting - Adzuna has 1 call/second limit
          if (page < pagesToFetch) {
            await this.delay(1100);
          }

        } catch (error) {
          logger.error(`Error fetching Adzuna page ${page}:`, error.message);
          break;
        }
      }

      logger.info(`Adzuna fetch completed: ${jobs.length} jobs`);
      return jobs.slice(0, limit);

    } catch (error) {
      logger.error('Adzuna fetching failed:', error);
      throw new Error(`Adzuna fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch a single page of results
   */
  async fetchPage(query, location, page, resultsPerPage) {
    try {
      const url = `${this.baseUrl}/${this.country}/search/${page}`;
      
      const params = {
        app_id: this.appId,
        app_key: this.appKey,
        results_per_page: resultsPerPage,
        what: query,
        where: location,
        sort_by: 'date', // Most recent first
        content-type: 'application/json'
      };

      const response = await axios.get(url, {
        params,
        timeout: 15000
      });

      if (!response.data || !response.data.results) {
        logger.warn('Invalid response from Adzuna API');
        return [];
      }

      return response.data.results.map(job => this.parseJob(job));

    } catch (error) {
      if (error.response?.status === 429) {
        logger.warn('Adzuna rate limit exceeded, waiting...');
        await this.delay(5000);
        return this.fetchPage(query, location, page, resultsPerPage);
      }
      throw error;
    }
  }

  /**
   * Parse Adzuna job into our format
   */
  parseJob(adzunaJob) {
    const job = {
      // Basic info
      title: adzunaJob.title || 'Unknown Title',
      company: adzunaJob.company?.display_name || 'Unknown Company',
      location: this.formatLocation(adzunaJob.location),
      
      // Description
      description: this.cleanDescription(adzunaJob.description),
      summary: this.createSummary(adzunaJob.description),
      
      // External reference
      externalId: adzunaJob.id?.toString() || `adzuna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      externalUrl: adzunaJob.redirect_url || adzunaJob.url,
      source: 'adzuna',
      
      // Job details
      jobType: this.parseJobType(adzunaJob.contract_type || adzunaJob.contract_time),
      workMode: 'unknown',
      
      // Salary
      salary: this.parseSalary(adzunaJob),
      
      // Skills (extracted from description)
      requiredSkills: this.extractSkills(adzunaJob.description),
      
      // Dates
      postedDate: adzunaJob.created ? new Date(adzunaJob.created) : new Date(),
      scrapedAt: new Date(),
      
      // Company info
      companyInfo: {}
    };

    // Add company info if available
    if (adzunaJob.company) {
      job.companyInfo = {
        website: adzunaJob.company.url || null,
        description: null
      };
    }

    // Add category if available
    if (adzunaJob.category?.label) {
      job.companyInfo.industry = adzunaJob.category.label;
    }

    return job;
  }

  /**
   * Format location
   */
  formatLocation(location) {
    if (!location) return 'India';
    
    const parts = [];
    if (location.area && location.area[0]) parts.push(location.area[0]);
    if (location.area && location.area[1]) parts.push(location.area[1]);
    if (location.area && location.area[2]) parts.push(location.area[2]);
    
    return parts.length > 0 ? parts.join(', ') : 'India';
  }

  /**
   * Clean HTML from description
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // Remove HTML tags
    let cleaned = description.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned.substring(0, 10000); // Limit length
  }

  /**
   * Create summary from description
   */
  createSummary(description) {
    const cleaned = this.cleanDescription(description);
    return cleaned.substring(0, 500);
  }

  /**
   * Parse job type
   */
  parseJobType(contractType) {
    if (!contractType) return 'unknown';
    
    const type = contractType.toLowerCase();
    
    if (type.includes('permanent') || type.includes('full')) return 'full-time';
    if (type.includes('part')) return 'part-time';
    if (type.includes('contract')) return 'contract';
    if (type.includes('temporary')) return 'temporary';
    if (type.includes('internship')) return 'internship';
    
    return 'unknown';
  }

  /**
   * Parse salary
   */
  parseSalary(job) {
    if (!job.salary_min && !job.salary_max) return null;

    const salary = {
      currency: 'INR',
      period: 'annual',
      text: ''
    };

    // Adzuna returns salary in local currency (INR for India)
    if (job.salary_min) {
      salary.min = Math.round(job.salary_min);
    }
    
    if (job.salary_max) {
      salary.max = Math.round(job.salary_max);
    }

    // Create text representation
    if (salary.min && salary.max) {
      const minLakhs = (salary.min / 100000).toFixed(1);
      const maxLakhs = (salary.max / 100000).toFixed(1);
      salary.text = `₹${minLakhs}L - ₹${maxLakhs}L per year`;
    } else if (salary.min) {
      const lakhs = (salary.min / 100000).toFixed(1);
      salary.text = `₹${lakhs}L+ per year`;
    } else if (salary.max) {
      const lakhs = (salary.max / 100000).toFixed(1);
      salary.text = `Up to ₹${lakhs}L per year`;
    }

    return salary;
  }

  /**
   * Extract skills from description
   */
  extractSkills(description) {
    if (!description) return [];

    const skillKeywords = [
      // Programming Languages
      'javascript', 'java', 'python', 'c\\+\\+', 'c#', 'php', 'ruby', 'swift', 'kotlin', 
      'typescript', 'golang', 'rust', 'scala',
      
      // Frontend
      'react', 'angular', 'vue', 'html', 'css', 'sass', 'bootstrap', 'tailwind',
      'redux', 'next\\.js', 'webpack',
      
      // Backend
      'node\\.js', 'express', 'django', 'flask', 'spring', 'laravel', '\\.net',
      
      // Databases
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'oracle', 'dynamodb',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
      'git', 'linux',
      
      // Mobile
      'android', 'ios', 'react native', 'flutter',
      
      // Other
      'machine learning', 'ai', 'data science', 'agile', 'scrum'
    ];

    const skills = [];
    const lowerDesc = description.toLowerCase();

    skillKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerDesc)) {
        const skill = keyword
          .replace(/\\b/g, '')
          .replace(/\\\./g, '.')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        skills.push(skill);
      }
    });

    return [...new Set(skills)].slice(0, 15); // Max 15 skills
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AdzunaScraper();
