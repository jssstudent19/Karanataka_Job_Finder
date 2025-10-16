const axios = require('axios');
const ExternalJob = require('../src/models/ExternalJob');

class LinkedInJobsService {
  constructor() {
    this.apiKey = process.env.LINKEDIN_RAPIDAPI_KEY;
    this.apiHost = process.env.LINKEDIN_RAPIDAPI_HOST;
    this.baseUrl = `https://${this.apiHost}`;
  }

  /**
   * Fetch active LinkedIn jobs (posted within last 7 days)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of job objects
   */
  async fetchActiveJobs(options = {}) {
    const {
      offset = 0,
      locationFilter = 'Karnataka OR Bangalore OR Bengaluru',
      titleFilter = '',
      descriptionType = 'text', // Include full description
      typeFilter = 'FULL_TIME,PART_TIME,CONTRACTOR',
      remote = '', // Leave empty for both remote and on-site
      limit = 50
    } = options;

    console.log(`\n🔍 Fetching LinkedIn Jobs (location: ${locationFilter})...`);

    try {
      const response = await axios.get(`${this.baseUrl}/active-jb-7d`, {
        params: {
          limit,
          offset,
          location_filter: locationFilter,
          title_filter: titleFilter,
          description_type: descriptionType,
          type_filter: typeFilter,
          remote: remote,
        },
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && Array.isArray(response.data)) {
        const jobs = response.data.slice(0, limit);
        console.log(`✅ LinkedIn: Fetched ${jobs.length} active jobs`);
        return jobs;
      }

      console.log('⚠️  LinkedIn: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ LinkedIn API Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Normalize LinkedIn job data to our ExternalJob schema
   * @param {Object} job - Raw LinkedIn job object
   * @returns {Object} Normalized job object
   */
  normalizeJobData(job) {
    // Extract location info
    const location = this.extractLocation(job);
    
    // Extract salary
    const salary = this.extractSalary(job);
    
    // Extract employment type
    const jobType = this.extractJobType(job);
    
    // Extract work mode
    const workMode = this.extractWorkMode(job);

    const normalized = {
      source: 'linkedin-rapidapi',
      externalId: `linkedin-${job.id}`,
      title: job.title || 'Untitled Position',
      company: job.organization || 'Not specified',
      location: location.display,
      description: job.description || job.linkedin_description || 'No description available',
      externalUrl: job.url || '',
      postedDate: job.date_posted ? new Date(job.date_posted) : new Date(),
      jobType: jobType,
      workMode: workMode,
      requirements: ['See job description'], // LinkedIn doesn't provide structured requirements
      benefits: [],
      experienceLevel: job.seniority_filter || 'Not specified',
      status: 'active',
      isActive: true,
      
      // Additional LinkedIn-specific metadata
      linkedin: {
        orgEmployees: job.linkedin_org_employees,
        orgIndustry: job.linkedin_org_industry,
        orgSize: job.linkedin_org_size,
        orgUrl: job.linkedin_org_url,
        orgFoundedDate: job.linkedin_org_foundeddate,
        orgHeadquarters: job.linkedin_org_headquarters,
        orgFollowers: job.linkedin_org_followers,
        orgSpecialties: job.linkedin_org_specialties || [],
        recruiterName: job.recruiter_name,
        recruiterTitle: job.recruiter_title,
        recruiterUrl: job.recruiter_url
      },
      
      // Location metadata
      parsedLocation: {
        city: location.city,
        region: location.region,
        country: location.country,
        coordinates: location.coordinates
      },
      
      lastSyncedAt: new Date()
    };

    // Add salary if available
    if (salary) {
      normalized.salary = salary;
    }

    return normalized;
  }

  /**
   * Extract location from LinkedIn job data
   * @param {Object} job - LinkedIn job object
   * @returns {Object} Location object
   */
  extractLocation(job) {
    const cities = job.cities_derived || [];
    const regions = job.regions_derived || [];
    const countries = job.countries_derived || [];
    const locations = job.locations_derived || [];

    let city = cities.length > 0 ? cities[0] : null;
    let region = regions.length > 0 ? regions[0] : null;
    let country = countries.length > 0 ? countries[0] : 'India';

    // If we have a full location string, use it
    let display = locations.length > 0 ? locations[0] : '';
    
    // Otherwise construct it
    if (!display) {
      const parts = [city, region, country].filter(Boolean);
      display = parts.join(', ') || 'India';
    }

    // Get coordinates
    const lats = job.lats_derived || [];
    const lngs = job.lngs_derived || [];
    const coordinates = lats.length > 0 && lngs.length > 0 
      ? { lat: lats[0], lng: lngs[0] }
      : null;

    return { display, city, region, country, coordinates };
  }

  /**
   * Extract salary from LinkedIn job data
   * @param {Object} job - LinkedIn job object
   * @returns {Object|null} Salary object or null
   */
  extractSalary(job) {
    if (job.salary_raw && job.salary_raw.value) {
      const salaryValue = job.salary_raw.value;
      const currency = job.salary_raw.currency || 'USD';
      
      if (salaryValue.minValue && salaryValue.maxValue) {
        return {
          min: salaryValue.minValue,
          max: salaryValue.maxValue,
          currency: currency,
          period: (salaryValue.unitText || 'YEAR').toLowerCase()
        };
      }
    }
    return null;
  }

  /**
   * Extract job type from LinkedIn job data
   * @param {Object} job - LinkedIn job object
   * @returns {String} Job type
   */
  extractJobType(job) {
    if (job.employment_type && Array.isArray(job.employment_type) && job.employment_type.length > 0) {
      const type = job.employment_type[0];
      const typeMap = {
        'FULL_TIME': 'Full-time',
        'PART_TIME': 'Part-time',
        'CONTRACTOR': 'Contract',
        'INTERN': 'Internship',
        'TEMPORARY': 'Temporary',
        'VOLUNTEER': 'Volunteer',
        'OTHER': 'Other'
      };
      return typeMap[type] || 'Full-time';
    }
    return 'Full-time';
  }

  /**
   * Extract work mode from LinkedIn job data
   * @param {Object} job - LinkedIn job object
   * @returns {String} Work mode
   */
  extractWorkMode(job) {
    if (job.remote_derived === true || job.location_type === 'TELECOMMUTE') {
      return 'Remote';
    }
    
    // Check description for remote/hybrid keywords
    const desc = (job.description || '').toLowerCase();
    if (desc.includes('hybrid')) {
      return 'Hybrid';
    } else if (desc.includes('remote') || desc.includes('work from home')) {
      return 'Remote';
    }
    
    return 'On-site';
  }

  /**
   * Fetch and save LinkedIn jobs to database
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Results object
   */
  async fetchAndSaveJobs(options = {}) {
    const jobs = await this.fetchActiveJobs(options);
    
    if (jobs.length === 0) {
      return {
        fetched: 0,
        saved: 0,
        duplicates: 0,
        errors: 0
      };
    }

    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        const normalizedJob = this.normalizeJobData(job);
        
        // Check if job already exists
        const existing = await ExternalJob.findOne({
          externalId: normalizedJob.externalId
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // Save new job
        await ExternalJob.create(normalizedJob);
        saved++;
      } catch (error) {
        console.error(`Error saving LinkedIn job: ${job.title}`, error.message);
        errors++;
      }
    }

    return {
      fetched: jobs.length,
      saved,
      duplicates,
      errors
    };
  }
}

module.exports = new LinkedInJobsService();
