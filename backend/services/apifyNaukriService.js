/**
 * Apify Naukri Jobs Service
 * Fetches Naukri jobs scraped via Apify actors
 */

const axios = require('axios');
const ExternalJob = require('../src/models/ExternalJob');

class ApifyNaukriService {
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

    console.log(`\n🔍 Fetching Naukri jobs from Apify run: ${runId}...`);

    try {
      const url = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiToken}`;
      
      const response = await axios.get(url, {
        timeout: 30000
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Apify Naukri: Fetched ${response.data.length} jobs`);
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
   * Normalize Apify Naukri job data to our ExternalJob schema
   */
  normalizeJobData(job) {
    // Extract salary info
    let salary = null;
    if (job.salaryDetail && (job.salaryDetail.minimumSalary || job.salaryDetail.maximumSalary)) {
      salary = {
        min: job.salaryDetail.minimumSalary || 0,
        max: job.salaryDetail.maximumSalary || 0,
        currency: job.salaryDetail.currency || 'INR',
        period: 'annual',
        text: job.salaryDetail.label || ''
      };
    }

    // Extract location
    const location = job.locations && job.locations.length > 0
      ? job.locations.map(loc => loc.label).join(', ')
      : job.basicInfo?.placeholders?.find(p => p.type === 'location')?.label || 'India';

    // Extract skills
    const skills = [];
    if (job.keySkills) {
      if (job.keySkills.preferred) {
        skills.push(...job.keySkills.preferred.map(s => s.label));
      }
      if (job.keySkills.other) {
        skills.push(...job.keySkills.other.map(s => s.label));
      }
    }

    // Extract experience level
    const experienceLevel = this.mapExperienceLevel(job.minimumExperience, job.maximumExperience);

    // Job type
    const jobType = this.mapJobType(job.jobType || job.employmentType);

    // Work mode
    const workMode = this.extractWorkMode(job);

    // Description - strip HTML tags for cleaner display
    let description = job.description || job.basicInfo?.jobDescription || 'No description available';
    description = this.stripHtmlTags(description);

    return {
      source: 'apify-naukri',
      externalId: `apify-naukri-${job.jobId}`,
      title: job.title || job.basicInfo?.title || 'Untitled Position',
      company: job.companyDetail?.name || job.basicInfo?.companyName || 'Not specified',
      location: location,
      description: description.length > 10000 ? description.substring(0, 10000) : description,
      externalUrl: job.staticUrl || (job.basicInfo?.jdURL ? `https://www.naukri.com${job.basicInfo.jdURL}` : ''),
      postedDate: job.createdDate ? new Date(job.createdDate) : new Date(),
      jobType: jobType,
      workMode: workMode,
      requirements: ['See job description'],
      benefits: this.extractBenefits(job),
      requiredSkills: skills.slice(0, 20),
      experienceLevel: experienceLevel,
      status: 'active',
      
      // Salary
      salary: salary,
      
      // Company info
      companyInfo: {
        size: job.companyDetail?.companySize || '',
        industry: job.industry || '',
        website: job.companyDetail?.websiteUrl || '',
        logo: job.clientLogo || job.basicInfo?.logoPath || '',
        description: (job.companyDetail?.details || '').substring(0, 2000)
      },
      
      lastSyncedAt: new Date()
    };
  }

  /**
   * Map experience years to experience level
   */
  mapExperienceLevel(minExp, maxExp) {
    if (!minExp && !maxExp) return 'unknown';
    
    const avgExp = ((minExp || 0) + (maxExp || 0)) / 2;
    
    if (avgExp === 0) return 'entry';
    if (avgExp <= 2) return 'junior';
    if (avgExp <= 5) return 'mid';
    if (avgExp <= 10) return 'senior';
    return 'lead';
  }

  /**
   * Map Naukri job type to our schema
   */
  mapJobType(jobType) {
    if (!jobType) return 'Full-time';
    
    const type = jobType.toLowerCase();
    if (type.includes('full')) return 'Full-time';
    if (type.includes('part')) return 'Part-time';
    if (type.includes('contract')) return 'Contract';
    if (type.includes('temporary')) return 'Temporary';
    if (type.includes('intern')) return 'Internship';
    if (type.includes('permanent')) return 'Full-time';
    
    return 'Full-time';
  }

  /**
   * Strip HTML tags from text
   */
  stripHtmlTags(html) {
    if (!html) return '';
    
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&rsquo;/g, "'")
               .replace(/&lsquo;/g, "'")
               .replace(/&rdquo;/g, '"')
               .replace(/&ldquo;/g, '"');
    
    // Clean up multiple spaces and newlines
    text = text.replace(/\s+/g, ' ')
               .replace(/\n\s*\n/g, '\n')
               .trim();
    
    return text;
  }

  /**
   * Extract work mode from job data
   */
  extractWorkMode(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const wfhType = job.wfhType;
    
    // Check WFH type flag
    if (wfhType === '1' || wfhType === '2') {
      return 'Remote';
    }
    
    // Check for remote indicators
    if (title.includes('remote') || description.includes('remote') || 
        description.includes('work from home') || description.includes('wfh')) {
      return 'Remote';
    }
    
    // Check for hybrid
    if (title.includes('hybrid') || description.includes('hybrid')) {
      return 'Hybrid';
    }
    
    return 'On-site';
  }

  /**
   * Extract benefits from AmbitionBox data
   */
  extractBenefits(job) {
    const benefits = [];
    
    if (job.ambitionBoxDetails && job.ambitionBoxDetails.benefits && job.ambitionBoxDetails.benefits.List) {
      job.ambitionBoxDetails.benefits.List.forEach(benefit => {
        if (typeof benefit === 'string') {
          // Parse the benefit string (format: @{BenefitName=...; Status=...})
          const match = benefit.match(/BenefitName=([^;]+)/);
          if (match && match[1]) {
            benefits.push(match[1]);
          }
        }
      });
    }
    
    return benefits.slice(0, 10);
  }

  /**
   * Save Apify Naukri jobs to database
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
        console.error(`Error saving job: ${job.title}`, error.message);
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

module.exports = new ApifyNaukriService();
