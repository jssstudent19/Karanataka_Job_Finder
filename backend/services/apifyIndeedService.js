/**
 * Apify Indeed Jobs Service
 * Fetches Indeed jobs scraped via Apify actors
 */

const axios = require('axios');
const ExternalJob = require('../src/models/ExternalJob');

class ApifyIndeedService {
  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN || '';
    this.baseUrl = 'https://api.apify.com/v2';
  }

  /**
   * Fetch dataset items from an Apify actor run
   */
  async fetchJobsFromRun(runId) {
    if (!this.apiToken) {
      throw new Error('APIFY_API_TOKEN not configured in .env');
    }

    console.log(`\n🔍 Fetching Indeed jobs from Apify run: ${runId}...`);

    try {
      const url = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiToken}`;
      
      const response = await axios.get(url, {
        timeout: 30000
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Apify Indeed: Fetched ${response.data.length} jobs`);
        return response.data;
      }

      console.log('⚠️  No jobs found in Apify dataset');
      return [];

    } catch (error) {
      console.error('❌ Apify API Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
      return [];
    }
  }

  /**
   * Normalize Apify Indeed job data to our ExternalJob schema
   */
  normalizeJobData(job) {
    // Extract salary info
    let salary = null;
    if (job.salary) {
      salary = { text: job.salary };
    }

    // Extract job type from jobType array
    const jobTypes = job.jobType || [];
    const jobType = this.mapJobType(jobTypes);

    // Work mode
    const workMode = this.extractWorkMode(job);

    // Experience level from job type
    const experienceLevel = this.mapExperienceLevel(jobTypes);

    // Parse posted date
    const postedDate = job.postingDateParsed 
      ? new Date(job.postingDateParsed) 
      : this.parsePostedAt(job.postedAt);

    // Description
    const description = job.description || 'No description available';

    return {
      source: 'apify-indeed',
      externalId: `apify-indeed-${job.id}`,
      title: job.positionName || 'Untitled Position',
      company: job.company || 'Not specified',
      location: job.location || 'India',
      description: description.length > 10000 ? description.substring(0, 10000) : description,
      externalUrl: job.url || '',
      postedDate: postedDate,
      jobType: jobType,
      workMode: workMode,
      requirements: ['See job description'],
      benefits: [],
      requiredSkills: [],
      experienceLevel: experienceLevel,
      status: 'active',
      
      // Salary
      salary: salary,
      
      // Company info
      companyInfo: {
        size: '',
        industry: '',
        website: '',
        logo: '',
        description: ''
      },
      
      // Indeed-specific data
      indeed: {
        rating: job.rating,
        reviewsCount: job.reviewsCount,
        externalApplyLink: job.externalApplyLink
      },
      
      lastSyncedAt: new Date()
    };
  }

  /**
   * Map Indeed job types to our schema
   */
  mapJobType(jobTypes) {
    if (!jobTypes || jobTypes.length === 0) return 'Full-time';
    
    const types = jobTypes.map(t => t.toLowerCase());
    
    if (types.some(t => t.includes('full'))) return 'Full-time';
    if (types.some(t => t.includes('part'))) return 'Part-time';
    if (types.some(t => t.includes('contract'))) return 'Contract';
    if (types.some(t => t.includes('temporary'))) return 'Temporary';
    if (types.some(t => t.includes('intern'))) return 'Internship';
    
    return 'Full-time';
  }

  /**
   * Map Indeed job types to experience level
   */
  mapExperienceLevel(jobTypes) {
    if (!jobTypes || jobTypes.length === 0) return 'unknown';
    
    const types = jobTypes.map(t => t.toLowerCase());
    
    if (types.some(t => t.includes('fresher') || t.includes('entry'))) return 'entry';
    if (types.some(t => t.includes('junior'))) return 'junior';
    if (types.some(t => t.includes('senior'))) return 'senior';
    if (types.some(t => t.includes('lead') || t.includes('manager'))) return 'lead';
    if (types.some(t => t.includes('director') || t.includes('executive'))) return 'executive';
    
    return 'mid'; // Default to mid-level
  }

  /**
   * Extract work mode from job data
   */
  extractWorkMode(job) {
    const title = (job.positionName || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    
    // Check for remote indicators
    if (title.includes('remote') || description.includes('remote') || 
        location.includes('remote') || description.includes('work from home')) {
      return 'Remote';
    }
    
    // Check for hybrid
    if (title.includes('hybrid') || description.includes('hybrid')) {
      return 'Hybrid';
    }
    
    return 'On-site';
  }

  /**
   * Parse "X days ago" format to Date
   */
  parsePostedAt(postedAt) {
    if (!postedAt) return new Date();
    
    try {
      const daysMatch = postedAt.match(/(\d+)\s*days?\s*ago/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
      }
      
      if (postedAt.toLowerCase().includes('today')) {
        return new Date();
      }
      
      if (postedAt.toLowerCase().includes('yesterday')) {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
      }
    } catch (error) {
      console.error('Error parsing postedAt:', postedAt, error.message);
    }
    
    return new Date();
  }

  /**
   * Save Apify Indeed jobs to database
   */
  async fetchAndSaveJobs(runId) {
    const jobs = await this.fetchJobsFromRun(runId);
    
    if (jobs.length === 0) {
      return {
        fetched: 0,
        saved: 0,
        updated: 0,
        errors: 0
      };
    }

    let saved = 0;
    let updated = 0;
    let errors = 0;

    console.log(`\n💾 Saving ${jobs.length} jobs to database...`);

    for (const job of jobs) {
      try {
        const normalizedJob = this.normalizeJobData(job);
        
        // Check if job already exists
        const existing = await ExternalJob.findOne({
          externalId: normalizedJob.externalId
        });

        if (existing) {
          // Update existing job
          await ExternalJob.updateOne(
            { externalId: normalizedJob.externalId },
            { $set: normalizedJob }
          );
          updated++;
        } else {
          // Save new job
          await ExternalJob.create(normalizedJob);
          saved++;
        }
      } catch (error) {
        console.error(`Error saving job: ${job.positionName}`, error.message);
        errors++;
      }
    }

    console.log(`✅ Saved ${saved} new jobs, updated ${updated} jobs, ${errors} errors\n`);

    return {
      fetched: jobs.length,
      saved,
      updated,
      errors
    };
  }
}

module.exports = new ApifyIndeedService();
