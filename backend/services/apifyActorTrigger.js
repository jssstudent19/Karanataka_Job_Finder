/**
 * Apify Actor Trigger Service
 * Starts Apify actors on-demand and fetches results for job recommendations
 */

const { ApifyClient } = require('apify-client');
const ExternalJob = require('../src/models/ExternalJob');

class ApifyActorTrigger {
  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN;
    if (!this.apiToken) {
      console.warn('⚠️  APIFY_API_TOKEN not configured in .env');
      this.client = null;
    } else {
      this.client = new ApifyClient({
        token: this.apiToken,
      });
    }

    // Working LinkedIn Job Scraper Actor IDs
    this.actorIds = {
      linkedin: 'curious_coder/linkedin-jobs-scraper', // Found via Apify store search
      // Alternative: 'cheap_scraper/linkedin-job-scraper'
    };
  }

  /**
   * Trigger LinkedIn job scraping based on resume analysis
   * @param {Object} jobPreferences - Parsed job preferences from resume
   * @returns {Promise<Array>} Array of recommended jobs
   */
  async getJobRecommendations(jobPreferences) {
    // Check database first for existing jobs (LinkedIn & Indeed)
    console.log('💾 Checking database for existing jobs...');
    
    try {
      const ExternalJob = require('../src/models/ExternalJob');
      const existingJobs = await ExternalJob.find({ 
        source: { $in: ['apify-linkedin', 'apify-indeed'] },
        status: 'active'
      }).limit(20);
      
      if (existingJobs.length > 0) {
        console.log(`📊 Found ${existingJobs.length} jobs in database (LinkedIn/Indeed)`);
        
        // Process and score existing jobs
        const recommendations = [];
        
        for (const job of existingJobs) {
          const relevanceScore = this.calculateRelevanceScore(job, jobPreferences);
          const matchReasons = this.getMatchReasons(job, jobPreferences);
          
          recommendations.push({
            ...job.toObject(),
            relevanceScore,
            matchReasons,
            recommendedAt: new Date()
          });
        }
        
        // Sort by relevance
        recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        console.log(`✅ Returning ${recommendations.length} database recommendations`);
        return recommendations.slice(0, 10); // Top 10
      }
    } catch (error) {
      console.error('❌ Database query failed:', error.message);
    }
    
    // Fallback to mock data if no database jobs
    console.log('🎭 No database jobs found, using mock recommendations');
    return this.getMockJobRecommendations(jobPreferences);
    
    // ORIGINAL CODE DISABLED:
    /*
    if (!this.client) {
      console.log('⚠️  Apify not configured, using mock data...');
      return this.getMockJobRecommendations(jobPreferences);
    }

    try {
      console.log('🚀 Starting LinkedIn job search for:', jobPreferences);

      // Build search input for LinkedIn scraper
      const searchInput = this.buildLinkedInSearchInput(jobPreferences);
      
      console.log('📝 Search Input:', searchInput);

      // Start the actor run
      const run = await this.client.actor(this.actorIds.linkedin).call(searchInput);
      
      console.log(`🎬 Actor run started: ${run.id}`);
      console.log(`📊 Status: ${run.status}`);

      // Wait for completion (with timeout)
      const completedRun = await this.waitForCompletion(run.id, 300000); // 5 minutes timeout
      
      if (completedRun.status === 'SUCCEEDED') {
        console.log('✅ Actor run completed successfully');
        
        // Fetch the results
        const jobs = await this.fetchRunResults(run.id);
        
        // Save to database and return recommendations
        const recommendations = await this.processJobRecommendations(jobs, jobPreferences);
        
        return recommendations;
      } else {
        console.error('❌ Actor run failed:', completedRun.status);
        return this.getMockJobRecommendations(jobPreferences);
      }

    } catch (error) {
      console.error('❌ Error triggering LinkedIn scraper:', error.message);
      console.log('🔄 Returning mock recommendations...');
      return this.getMockJobRecommendations(jobPreferences);
    }
    */
  }

  /**
   * Build LinkedIn search input configuration
   * @param {Object} preferences - Job preferences
   * @returns {Object} Apify actor input
   */
  buildLinkedInSearchInput(preferences) {
    // Build search keywords for LinkedIn URL
    const keywords = [preferences.role, ...preferences.skills.slice(0, 2)].join(' ');
    const encodedKeywords = encodeURIComponent(keywords);
    const encodedLocation = encodeURIComponent('Bengaluru, Karnataka, India');
    
    // Build LinkedIn search URL as required by curious_coder/linkedin-jobs-scraper
    const linkedinUrl = `https://www.linkedin.com/jobs/search?keywords=${encodedKeywords}&location=${encodedLocation}&geoId=105214831&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0`;
    
    return {
      // Configuration for curious_coder/linkedin-jobs-scraper
      urls: [linkedinUrl],
      
      // Scrape company details
      scrapeCompanyDetails: true,
      
      // Number of jobs needed (limit to 20 for faster processing)
      numberOfJobs: 20
    };
  }

  /**
   * Map our experience levels to LinkedIn format
   */
  mapExperienceLevelForLinkedIn(experienceLevel) {
    const mapping = {
      'entry': 'INTERNSHIP,ENTRY_LEVEL',
      'junior': 'ENTRY_LEVEL,ASSOCIATE',
      'mid': 'ASSOCIATE,MID_SENIOR',
      'senior': 'MID_SENIOR,DIRECTOR',
      'lead': 'DIRECTOR,EXECUTIVE',
      'executive': 'EXECUTIVE'
    };
    
    return mapping[experienceLevel] || 'ASSOCIATE,MID_SENIOR';
  }

  /**
   * Wait for actor run to complete
   * @param {string} runId - Run ID to monitor
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Completed run info
   */
  async waitForCompletion(runId, timeout = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const run = await this.client.run(runId).get();
      
      console.log(`⏳ Run status: ${run.status} (${Math.round((Date.now() - startTime) / 1000)}s)`);
      
      if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
        return run;
      }
      
      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    throw new Error('Actor run timeout');
  }

  /**
   * Fetch results from completed run
   * @param {string} runId - Run ID
   * @returns {Promise<Array>} Job results
   */
  async fetchRunResults(runId) {
    try {
      const { items } = await this.client.run(runId).dataset().listItems();
      console.log(`📊 Retrieved ${items.length} jobs from actor run`);
      return items || [];
    } catch (error) {
      console.error('Error fetching run results:', error.message);
      return [];
    }
  }

  /**
   * Process and save job recommendations
   * @param {Array} jobs - Raw job data from Apify
   * @param {Object} preferences - User preferences for scoring
   * @returns {Promise<Array>} Processed recommendations
   */
  async processJobRecommendations(jobs, preferences) {
    if (jobs.length === 0) {
      return [];
    }

    const recommendations = [];

    for (const job of jobs.slice(0, 10)) { // Limit to top 10
      try {
        // Normalize the job data
        const normalizedJob = this.normalizeLinkedInJob(job);
        
        // Calculate relevance score
        const relevanceScore = this.calculateRelevanceScore(normalizedJob, preferences);
        
        // Add recommendation metadata
        const recommendation = {
          ...normalizedJob,
          relevanceScore,
          matchReasons: this.getMatchReasons(normalizedJob, preferences),
          recommendedAt: new Date()
        };

        recommendations.push(recommendation);
        
        // Save to database for future reference
        await this.saveJobToDatabase(recommendation);
        
      } catch (error) {
        console.error('Error processing job:', error.message);
      }
    }

    // Sort by relevance score
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log(`✅ Processed ${recommendations.length} job recommendations`);
    return recommendations;
  }

  /**
   * Normalize LinkedIn job data from Apify
   */
  normalizeLinkedInJob(job) {
    return {
      source: 'apify-linkedin',
      externalId: `apify-linkedin-${job.id || Date.now()}`,
      title: job.title || job.positionName || 'Unknown Position',
      company: job.company || job.companyName || 'Unknown Company',
      location: job.location || 'Karnataka, India',
      description: job.description || job.descriptionText || 'No description available',
      externalUrl: job.link || job.url || '',
      postedDate: job.postedAt ? new Date(job.postedAt) : new Date(),
      jobType: job.employmentType || 'Full-time',
      workMode: this.extractWorkMode(job),
      experienceLevel: this.mapLinkedInExperienceLevel(job.seniorityLevel),
      status: 'active',
      
      // LinkedIn specific data
      linkedin: {
        jobId: job.id,
        companyLogo: job.companyLogo,
        applicantsCount: job.applicantsCount,
        industries: job.industries
      }
    };
  }

  /**
   * Calculate job relevance score based on user preferences
   */
  calculateRelevanceScore(job, preferences) {
    let score = 0;
    
    // Title match (40 points)
    if (job.title.toLowerCase().includes(preferences.role.toLowerCase())) {
      score += 40;
    }
    
    // Skills match (30 points)
    const description = job.description.toLowerCase();
    const matchingSkills = preferences.skills.filter(skill => 
      description.includes(skill.toLowerCase())
    );
    score += (matchingSkills.length / preferences.skills.length) * 30;
    
    // Experience level match (20 points)
    if (job.experienceLevel === preferences.experience) {
      score += 20;
    }
    
    // Location match (10 points)
    if (job.location.toLowerCase().includes('karnataka') || 
        job.location.toLowerCase().includes('bangalore') ||
        job.location.toLowerCase().includes('bengaluru')) {
      score += 10;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get reasons why this job matches user preferences
   */
  getMatchReasons(job, preferences) {
    const reasons = [];
    
    if (job.title.toLowerCase().includes(preferences.role.toLowerCase())) {
      reasons.push(`Matches desired role: ${preferences.role}`);
    }
    
    const description = job.description.toLowerCase();
    const matchingSkills = preferences.skills.filter(skill => 
      description.includes(skill.toLowerCase())
    );
    
    if (matchingSkills.length > 0) {
      reasons.push(`Matches skills: ${matchingSkills.join(', ')}`);
    }
    
    if (job.experienceLevel === preferences.experience) {
      reasons.push(`Matches experience level: ${preferences.experience}`);
    }
    
    return reasons;
  }

  /**
   * Extract work mode from job data
   */
  extractWorkMode(job) {
    const text = `${job.title} ${job.description}`.toLowerCase();
    
    if (text.includes('remote')) return 'Remote';
    if (text.includes('hybrid')) return 'Hybrid';
    return 'On-site';
  }

  /**
   * Map LinkedIn experience level to our format
   */
  mapLinkedInExperienceLevel(level) {
    if (!level) return 'unknown';
    
    const levelLower = level.toLowerCase();
    if (levelLower.includes('entry')) return 'entry';
    if (levelLower.includes('associate')) return 'junior';
    if (levelLower.includes('mid')) return 'mid';
    if (levelLower.includes('senior')) return 'senior';
    if (levelLower.includes('director')) return 'lead';
    if (levelLower.includes('executive')) return 'executive';
    
    return 'mid';
  }

  /**
   * Save job to database
   */
  async saveJobToDatabase(job) {
    try {
      const existing = await ExternalJob.findOne({
        externalId: job.externalId
      });

      if (!existing) {
        await ExternalJob.create(job);
        console.log(`💾 Saved job: ${job.title} at ${job.company}`);
      }
    } catch (error) {
      console.error('Error saving job to database:', error.message);
    }
  }

  /**
   * Generate mock recommendations when Apify is not available
   */
  getMockJobRecommendations(preferences) {
    const mockJobs = [
      {
        source: 'mock-linkedin',
        externalId: `mock-${Date.now()}-1`,
        title: `Senior ${preferences.role}`,
        company: 'TechCorp India',
        location: 'Bangalore, Karnataka',
        description: `We are looking for a ${preferences.role} with ${preferences.experienceYears} years of experience in ${preferences.skills.join(', ')}.`,
        externalUrl: 'https://linkedin.com/jobs/mock-1',
        postedDate: new Date(),
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: preferences.experience,
        status: 'active',
        relevanceScore: 95,
        matchReasons: [`Matches desired role: ${preferences.role}`, `Matches skills: ${preferences.skills.slice(0,2).join(', ')}`],
        recommendedAt: new Date()
      },
      {
        source: 'mock-linkedin',
        externalId: `mock-${Date.now()}-2`,
        title: `${preferences.role} - Remote`,
        company: 'InnovateStart',
        location: 'Karnataka, India (Remote)',
        description: `Remote ${preferences.role} position requiring expertise in ${preferences.skills[0]} and ${preferences.skills[1] || 'related technologies'}.`,
        externalUrl: 'https://linkedin.com/jobs/mock-2',
        postedDate: new Date(),
        jobType: 'Full-time',
        workMode: 'Remote',
        experienceLevel: preferences.experience,
        status: 'active',
        relevanceScore: 88,
        matchReasons: [`Matches desired role: ${preferences.role}`, 'Remote work option'],
        recommendedAt: new Date()
      },
      {
        source: 'mock-linkedin',
        externalId: `mock-${Date.now()}-3`,
        title: `Lead ${preferences.role}`,
        company: 'Enterprise Solutions',
        location: 'Mysore, Karnataka',
        description: `Leadership role for ${preferences.role} with team management responsibilities. Required: ${preferences.skills.slice(0,3).join(', ')}.`,
        externalUrl: 'https://linkedin.com/jobs/mock-3',
        postedDate: new Date(),
        jobType: 'Full-time',
        workMode: 'On-site',
        experienceLevel: preferences.experience === 'senior' ? 'lead' : preferences.experience,
        status: 'active',
        relevanceScore: 82,
        matchReasons: [`Related to role: ${preferences.role}`, 'Leadership opportunity'],
        recommendedAt: new Date()
      }
    ];

    console.log(`🎭 Generated ${mockJobs.length} mock recommendations`);
    return mockJobs;
  }
}

module.exports = new ApifyActorTrigger();