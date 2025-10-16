/**
 * Apify LinkedIn Jobs Service
 * Fetches LinkedIn jobs scraped via Apify actors
 * NO RATE LIMITS - uses Apify API with your token
 */

const axios = require('axios');
const ExternalJob = require('../src/models/ExternalJob');

class ApifyLinkedInService {
  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN || '';
    this.baseUrl = 'https://api.apify.com/v2';
  }

  /**
   * Fetch dataset items from an Apify actor run
   * @param {string} runId - The actor run ID
   * @returns {Promise<Array>} Array of LinkedIn jobs
   */
  async fetchJobsFromRun(runId) {
    if (!this.apiToken) {
      throw new Error('APIFY_API_TOKEN not configured in .env');
    }

    console.log(`\n🔍 Fetching LinkedIn jobs from Apify run: ${runId}...`);

    try {
      const url = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiToken}`;
      
      const response = await axios.get(url, {
        timeout: 30000
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Apify LinkedIn: Fetched ${response.data.length} jobs`);
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
   * Normalize Apify LinkedIn job data to our ExternalJob schema
   * @param {Object} job - Raw Apify job object
   * @returns {Object} Normalized job object
   */
  normalizeJobData(job) {
    // Extract salary info
    let salary = null;
    if (job.salary && job.salary.trim()) {
      salary = { text: job.salary };
    }

    // Extract job type from employment type
    const jobType = this.mapEmploymentType(job.employmentType);

    // Determine work mode (remote/hybrid/onsite)
    const workMode = this.extractWorkMode(job);

    // Clean description text
    const description = job.descriptionText || job.descriptionHtml || 'No description available';

    return {
      source: 'apify-linkedin',
      externalId: `apify-linkedin-${job.id}`,
      title: job.title || 'Untitled Position',
      company: job.companyName || 'Not specified',
      location: job.location || 'India',
      description: description.length > 10000 ? description.substring(0, 10000) : description,
      externalUrl: job.link || job.applyUrl || '',
      postedDate: job.postedAt ? new Date(job.postedAt) : new Date(),
      jobType: jobType,
      workMode: workMode,
      requirements: ['See job description'],
      benefits: job.benefits || [],
      experienceLevel: this.mapExperienceLevel(job.seniorityLevel),
      status: 'active',
      
      // Salary if available
      salary: salary,
      
      // LinkedIn-specific metadata from Apify
      linkedin: {
        jobId: job.id,
        trackingId: job.trackingId,
        refId: job.refId,
        applicantsCount: job.applicantsCount,
        jobFunction: job.jobFunction,
        industries: job.industries,
        companyLinkedinUrl: job.companyLinkedinUrl,
        companyLogo: job.companyLogo,
        companyWebsite: job.companyWebsite,
        companyDescription: job.companyDescription,
        companyEmployeesCount: job.companyEmployeesCount,
        companySlogan: job.companySlogan,
        jobPosterName: job.jobPosterName,
        jobPosterTitle: job.jobPosterTitle,
        jobPosterPhoto: job.jobPosterPhoto,
        jobPosterProfileUrl: job.jobPosterProfileUrl
      },
      
      // Company address if available
      companyAddress: job.companyAddress,
      
      lastSyncedAt: new Date()
    };
  }

  /**
   * Map employment type from LinkedIn format
   */
  mapEmploymentType(employmentType) {
    if (!employmentType) return 'Full-time';
    
    const type = employmentType.toLowerCase();
    if (type.includes('full')) return 'Full-time';
    if (type.includes('part')) return 'Part-time';
    if (type.includes('contract')) return 'Contract';
    if (type.includes('temporary')) return 'Temporary';
    if (type.includes('intern')) return 'Internship';
    if (type.includes('volunteer')) return 'Volunteer';
    
    return 'Full-time';
  }

  /**
   * Map LinkedIn experience level to our schema
   */
  mapExperienceLevel(level) {
    if (!level) return 'unknown';
    
    const levelLower = level.toLowerCase();
    
    // Map LinkedIn levels to our enum: entry, junior, mid, senior, lead, executive, unknown
    if (levelLower.includes('entry') || levelLower.includes('entry level')) return 'entry';
    if (levelLower.includes('associate')) return 'junior';
    if (levelLower.includes('mid') || levelLower.includes('mid-senior')) return 'mid';
    if (levelLower.includes('senior')) return 'senior';
    if (levelLower.includes('director') || levelLower.includes('lead')) return 'lead';
    if (levelLower.includes('executive') || levelLower.includes('c-level')) return 'executive';
    if (levelLower.includes('intern')) return 'entry';
    if (levelLower.includes('not applicable') || levelLower.includes('not specified')) return 'unknown';
    
    return 'unknown';
  }

  /**
   * Extract work mode from job data
   */
  extractWorkMode(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.descriptionText || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    
    // Check for remote indicators
    if (title.includes('remote') || description.includes('remote') || 
        description.includes('work from home') || location.includes('remote')) {
      return 'Remote';
    }
    
    // Check for hybrid
    if (title.includes('hybrid') || description.includes('hybrid')) {
      return 'Hybrid';
    }
    
    return 'On-site';
  }

  /**
   * Save Apify LinkedIn jobs to database
   * @param {string} runId - Apify actor run ID
   * @returns {Promise<Object>} Results summary
   */
  async fetchAndSaveJobs(runId) {
    const jobs = await this.fetchJobsFromRun(runId);
    
    if (jobs.length === 0) {
      return {
        fetched: 0,
        saved: 0,
        updated: 0,
        duplicates: 0,
        errors: 0
      };
    }

    let saved = 0;
    let updated = 0;
    let duplicates = 0;
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
        console.error(`Error saving job: ${job.title}`, error.message);
        errors++;
      }
    }

    console.log(`✅ Saved ${saved} new jobs, updated ${updated} jobs, ${duplicates} duplicates, ${errors} errors\n`);

    return {
      fetched: jobs.length,
      saved,
      updated,
      duplicates,
      errors
    };
  }
}

module.exports = new ApifyLinkedInService();
