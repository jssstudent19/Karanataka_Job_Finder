const axios = require('axios');
const ExternalJob = require('../src/models/ExternalJob');
const linkedInJobsService = require('./linkedInJobsService'); // RapidAPI (rate limited)

class JobAggregatorService {
  constructor() {
    this.jsearchApiKey = process.env.JSEARCH_API_KEY;
    this.jsearchApiHost = process.env.JSEARCH_API_HOST;
    this.adzunaAppId = process.env.ADZUNA_APP_ID;
    this.adzunaAppKey = process.env.ADZUNA_APP_KEY;
    this.careerjetAffid = process.env.CAREERJET_AFFID;
    this.defaultLocation = process.env.DEFAULT_SEARCH_LOCATION || 'Karnataka,India';
  }

  // Helper function to add delay between requests
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to normalize job data
  normalizeJobData(job, source) {
    const extractedUrl = this.extractUrl(job, source);
    const extractedSalary = this.extractSalary(job, source);
    const extractedDescription = this.extractDescription(job, source);
    
    // Trim description to 10000 characters
    const trimmedDescription = extractedDescription && extractedDescription.length > 10000 
      ? extractedDescription.substring(0, 10000) 
      : extractedDescription;

    const normalized = {
      source,
      externalId: job.id || job.job_id || `${source}-${Date.now()}-${Math.random()}`,
      title: job.title || job.name || 'Untitled Position',
      company: this.extractCompany(job, source),
      location: this.extractLocation(job, source),
      description: trimmedDescription,
      externalUrl: extractedUrl || `https://example.com/${source}/${Date.now()}`, // Provide fallback URL
      postedDate: this.extractPostedDate(job, source),
      jobType: this.extractJobType(job, source),
      workMode: this.extractWorkMode(job, source),
      requirements: this.extractRequirements(job, source),
      benefits: this.extractBenefits(job, source),
      experienceLevel: 'unknown',
      status: 'active',
      lastSyncedAt: new Date()
    };

    // Add salary if available
    if (extractedSalary) {
      normalized.salary = { text: extractedSalary };
    }

    return normalized;
  }

  // Extract company name based on source
  extractCompany(job, source) {
    switch (source) {
      case 'jsearch':
        return job.employer_name || 'Not specified';
      case 'adzuna':
        return job.company?.display_name || 'Not specified';
      case 'careerjet':
        return job.company || 'Not specified';
      case 'themuse':
        return job.company?.name || 'Not specified';
      case 'remotive':
        return job.company_name || 'Not specified';
      case 'arbeitnow':
        return job.company_name || 'Not specified';
      default:
        return 'Not specified';
    }
  }

  // Extract location based on source
  extractLocation(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_city && job.job_state 
          ? `${job.job_city}, ${job.job_state}, ${job.job_country || 'India'}`
          : job.job_city || job.job_state || 'India';
      case 'adzuna':
        return job.location?.display_name || 'India';
      case 'careerjet':
        return job.locations || 'India';
      case 'themuse':
        return job.locations?.map(l => l.name).join(', ') || 'Remote';
      case 'remotive':
        return job.candidate_required_location || 'Remote';
      case 'arbeitnow':
        return job.location || 'Remote';
      default:
        return 'India';
    }
  }

  // Extract description based on source
  extractDescription(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_description || 'No description available';
      case 'adzuna':
        return job.description || 'No description available';
      case 'careerjet':
        return job.description || 'No description available';
      case 'themuse':
        return job.contents || 'No description available';
      case 'remotive':
        return job.description || 'No description available';
      case 'arbeitnow':
        return job.description || 'No description available';
      default:
        return 'No description available';
    }
  }

  // Extract URL based on source
  extractUrl(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_apply_link || job.job_google_link || '';
      case 'adzuna':
        return job.redirect_url || '';
      case 'careerjet':
        return job.url || '';
      case 'themuse':
        return job.refs?.landing_page || '';
      case 'remotive':
        return job.url || '';
      case 'arbeitnow':
        return job.url || '';
      default:
        return '';
    }
  }

  // Extract posted date based on source
  extractPostedDate(job, source) {
    let dateStr;
    switch (source) {
      case 'jsearch':
        dateStr = job.job_posted_at_datetime_utc;
        break;
      case 'adzuna':
        dateStr = job.created;
        break;
      case 'careerjet':
        dateStr = job.date;
        break;
      case 'themuse':
        dateStr = job.publication_date;
        break;
      case 'remotive':
        dateStr = job.publication_date;
        break;
      case 'arbeitnow':
        dateStr = job.created_at;
        break;
      default:
        return new Date();
    }
    
    try {
      // Handle Unix timestamp
      if (typeof dateStr === 'number') {
        return new Date(dateStr * 1000);
      }
      return dateStr ? new Date(dateStr) : new Date();
    } catch (error) {
      return new Date();
    }
  }

  // Extract salary based on source
  extractSalary(job, source) {
    switch (source) {
      case 'jsearch':
        if (job.job_min_salary && job.job_max_salary) {
          return `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || 'INR'}`;
        }
        return null;
      case 'adzuna':
        if (job.salary_min && job.salary_max) {
          return `${job.salary_min} - ${job.salary_max} INR`;
        }
        return null;
      case 'careerjet':
        return job.salary || null;
      default:
        return null;
    }
  }

  // Extract job type based on source
  extractJobType(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_employment_type || 'Full-time';
      case 'adzuna':
        return job.contract_type || 'Full-time';
      case 'remotive':
        return job.job_type || 'Full-time';
      case 'arbeitnow':
        return job.job_types?.join(', ') || 'Full-time';
      default:
        return 'Full-time';
    }
  }

  // Extract work mode based on source
  extractWorkMode(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_is_remote ? 'Remote' : 'On-site';
      case 'remotive':
        return 'Remote';
      case 'arbeitnow':
        return job.remote ? 'Remote' : 'On-site';
      default:
        // Try to detect from description or location
        const desc = this.extractDescription(job, source).toLowerCase();
        const loc = this.extractLocation(job, source).toLowerCase();
        if (desc.includes('remote') || loc.includes('remote')) {
          return 'Remote';
        } else if (desc.includes('hybrid')) {
          return 'Hybrid';
        }
        return 'On-site';
    }
  }

  // Extract requirements based on source
  extractRequirements(job, source) {
    const requirements = [];
    const description = this.extractDescription(job, source).toLowerCase();

    // Extract common requirements from description
    if (description.includes('bachelor') || description.includes('degree')) {
      requirements.push('Bachelor\'s degree or equivalent');
    }
    if (description.includes('experience') || description.includes('years')) {
      const match = description.match(/(\d+)\+?\s*years?/);
      if (match) {
        requirements.push(`${match[1]}+ years of experience`);
      }
    }

    return requirements.length > 0 ? requirements : ['See job description'];
  }

  // Extract benefits based on source
  extractBenefits(job, source) {
    const benefits = [];
    const description = this.extractDescription(job, source).toLowerCase();

    // Extract common benefits from description
    if (description.includes('health insurance')) benefits.push('Health Insurance');
    if (description.includes('401k') || description.includes('pension')) benefits.push('Retirement Plan');
    if (description.includes('pto') || description.includes('paid time off')) benefits.push('Paid Time Off');
    if (description.includes('work from home') || description.includes('remote')) benefits.push('Remote Work');
    if (description.includes('flexible')) benefits.push('Flexible Schedule');

    return benefits;
  }

  // Extract category based on source
  extractCategory(job, source) {
    switch (source) {
      case 'jsearch':
        return job.job_occupation || 'General';
      case 'adzuna':
        return job.category?.label || 'General';
      case 'remotive':
        return job.category || 'General';
      default:
        // Try to detect from title
        const title = (job.title || job.name || '').toLowerCase();
        if (title.includes('software') || title.includes('developer') || title.includes('engineer')) {
          return 'Software Development';
        } else if (title.includes('data') || title.includes('analyst')) {
          return 'Data & Analytics';
        } else if (title.includes('design') || title.includes('ui') || title.includes('ux')) {
          return 'Design';
        } else if (title.includes('marketing')) {
          return 'Marketing';
        } else if (title.includes('sales')) {
          return 'Sales';
        }
        return 'General';
    }
  }

  // Extract experience based on source
  extractExperience(job, source) {
    if (source === 'careerjet' && job.experience) {
      return job.experience;
    }

    const description = this.extractDescription(job, source).toLowerCase();
    const match = description.match(/(\d+)\+?\s*years?/);
    if (match) {
      return `${match[1]}+ years`;
    }

    return 'Not specified';
  }

  // 1. JSearch API (RapidAPI) - Best for India
  async fetchFromJSearch(location = this.defaultLocation, limit = 100) {
    console.log(`\n🔍 Fetching from JSearch API (location: ${location})...`);
    
    try {
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: `jobs in Karnataka OR Bangalore OR Bengaluru`,
          page: '1',
          num_pages: '5', // Fetch 5 pages for maximum results
          date_posted: 'month', // Jobs from last month for more results
          country: 'in' // India
        },
        headers: {
          'X-RapidAPI-Key': this.jsearchApiKey,
          'X-RapidAPI-Host': this.jsearchApiHost
        },
        timeout: 15000
      });

      if (response.data && response.data.data) {
        const jobs = response.data.data.slice(0, limit);
        console.log(`✅ JSearch: Fetched ${jobs.length} jobs`);
        return jobs.map(job => this.normalizeJobData(job, 'jsearch'));
      }

      console.log('⚠️  JSearch: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ JSearch Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
      return [];
    }
  }

  // 2. Adzuna API - India jobs
  async fetchFromAdzuna(location = 'Karnataka', limit = 50) {
    console.log(`\n🔍 Fetching from Adzuna API (location: ${location})...`);
    
    try {
      // Get jobs from last 30 days (maximum allowed by Adzuna)
      const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/in/search/1`, {
        params: {
          app_id: this.adzunaAppId,
          app_key: this.adzunaAppKey,
          results_per_page: limit,
          what: 'jobs',
          where: 'Karnataka OR Bangalore',
          max_days_old: 30 // Last 30 days for maximum jobs
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.results) {
        console.log(`✅ Adzuna: Fetched ${response.data.results.length} jobs`);
        return response.data.results.map(job => this.normalizeJobData(job, 'adzuna'));
      }

      console.log('⚠️  Adzuna: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ Adzuna Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
      return [];
    }
  }

  // 3. Careerjet API - India jobs
  async fetchFromCareerjet(location = 'Karnataka', limit = 50) {
    console.log(`\n🔍 Fetching from Careerjet API (location: ${location})...`);
    
    try {
      // Careerjet requires user_ip and user_agent parameters
      // Using HTTP instead of HTTPS as HTTPS endpoint has connection issues
      const response = await axios.get('http://public.api.careerjet.net/search', {
        params: {
          locale_code: 'en_IN',
          keywords: 'jobs',
          location: 'Karnataka, India',
          affid: this.careerjetAffid,
          pagesize: limit,
          page: 1,
          user_ip: '8.8.8.8', // Required parameter
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' // Required parameter
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.jobs) {
        console.log(`✅ Careerjet: Fetched ${response.data.jobs.length} jobs`);
        return response.data.jobs.map(job => this.normalizeJobData(job, 'careerjet'));
      }

      console.log('⚠️  Careerjet: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ Careerjet Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
      return [];
    }
  }

  // 4. The Muse API - No key required
  async fetchFromTheMuse(limit = 50) {
    console.log(`\n🔍 Fetching from The Muse API...`);
    
    try {
      const response = await axios.get('https://www.themuse.com/api/public/jobs', {
        params: {
          page: 1,
          descending: true
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.results) {
        const jobs = response.data.results.slice(0, limit);
        console.log(`✅ The Muse: Fetched ${jobs.length} jobs`);
        return jobs.map(job => this.normalizeJobData(job, 'themuse'));
      }

      console.log('⚠️  The Muse: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ The Muse Error:', error.message);
      return [];
    }
  }

  // 5. Remotive API - Remote jobs
  async fetchFromRemotive(limit = 50) {
    console.log(`\n🔍 Fetching from Remotive API...`);
    
    try {
      const response = await axios.get('https://remotive.com/api/remote-jobs', {
        params: {
          limit: limit
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.jobs) {
        console.log(`✅ Remotive: Fetched ${response.data.jobs.length} jobs`);
        return response.data.jobs.map(job => this.normalizeJobData(job, 'remotive'));
      }

      console.log('⚠️  Remotive: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ Remotive Error:', error.message);
      return [];
    }
  }

  // 6. LinkedIn Jobs API (RapidAPI) - Active jobs
  async fetchFromLinkedIn(location = 'Karnataka', limit = 50) {
    console.log(`\n🔍 Fetching from LinkedIn API (via RapidAPI)...`);
    
    try {
      // Use the LinkedIn service to fetch jobs
      const jobs = await linkedInJobsService.fetchActiveJobs({
        locationFilter: 'Karnataka OR Bangalore OR Bengaluru',
        limit: limit
      });

      // Jobs are already fetched, just normalize them for our system
      const normalizedJobs = jobs.map(job => linkedInJobsService.normalizeJobData(job));
      
      console.log(`✅ LinkedIn: Fetched ${normalizedJobs.length} jobs`);
      return normalizedJobs;
    } catch (error) {
      console.error('❌ LinkedIn Error:', error.message);
      return [];
    }
  }

  // 7. Arbeitnow API - Tech jobs
  async fetchFromArbeitnow(limit = 50) {
    console.log(`\n🔍 Fetching from Arbeitnow API...`);
    
    try {
      const response = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        const jobs = response.data.data.slice(0, limit);
        console.log(`✅ Arbeitnow: Fetched ${jobs.length} jobs`);
        return jobs.map(job => this.normalizeJobData(job, 'arbeitnow'));
      }

      console.log('⚠️  Arbeitnow: No jobs found');
      return [];
    } catch (error) {
      console.error('❌ Arbeitnow Error:', error.message);
      return [];
    }
  }

  // Aggregate jobs from all sources
  async aggregateAllJobs(options = {}) {
    const {
      location = this.defaultLocation,
      limitPerSource = 200, // Maximum limit for more jobs
      // Default sources: LinkedIn (freshest), JSearch, Adzuna, Careerjet
      sources = ['linkedin', 'jsearch', 'adzuna', 'careerjet']
    } = options;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           JOB AGGREGATION SERVICE - STARTED                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nLocation: ${location}`);
    console.log(`Sources: ${sources.join(', ')}`);
    console.log(`Limit per source: ${limitPerSource}\n`);

    const allJobs = [];
    const results = {
      total: 0,
      bySource: {},
      errors: []
    };

    // Fetch from LinkedIn (freshest jobs!)
    if (sources.includes('linkedin')) {
      try {
        const jobs = await this.fetchFromLinkedIn(location, limitPerSource);
        allJobs.push(...jobs);
        results.bySource.linkedin = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'linkedin', error: error.message });
      }
    }

    // Fetch from JSearch
    if (sources.includes('jsearch')) {
      try {
        const jobs = await this.fetchFromJSearch(location, limitPerSource);
        allJobs.push(...jobs);
        results.bySource.jsearch = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'jsearch', error: error.message });
      }
    }

    // Fetch from Adzuna
    if (sources.includes('adzuna')) {
      try {
        const jobs = await this.fetchFromAdzuna(location, limitPerSource);
        allJobs.push(...jobs);
        results.bySource.adzuna = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'adzuna', error: error.message });
      }
    }

    // Fetch from Careerjet
    if (sources.includes('careerjet')) {
      try {
        const jobs = await this.fetchFromCareerjet(location, limitPerSource);
        allJobs.push(...jobs);
        results.bySource.careerjet = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'careerjet', error: error.message });
      }
    }

    // Fetch from The Muse
    if (sources.includes('themuse')) {
      try {
        const jobs = await this.fetchFromTheMuse(limitPerSource);
        allJobs.push(...jobs);
        results.bySource.themuse = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'themuse', error: error.message });
      }
    }

    // Fetch from Remotive
    if (sources.includes('remotive')) {
      try {
        const jobs = await this.fetchFromRemotive(limitPerSource);
        allJobs.push(...jobs);
        results.bySource.remotive = jobs.length;
        await this.delay(2000); // Rate limiting
      } catch (error) {
        results.errors.push({ source: 'remotive', error: error.message });
      }
    }

    // Fetch from Arbeitnow
    if (sources.includes('arbeitnow')) {
      try {
        const jobs = await this.fetchFromArbeitnow(limitPerSource);
        allJobs.push(...jobs);
        results.bySource.arbeitnow = jobs.length;
      } catch (error) {
        results.errors.push({ source: 'arbeitnow', error: error.message });
      }
    }

    results.total = allJobs.length;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           AGGREGATION SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Total jobs fetched: ${results.total}\n`);
    console.log('Jobs by source:');
    Object.entries(results.bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} jobs`);
    });
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      results.errors.forEach(err => {
        console.log(`  ${err.source}: ${err.error}`);
      });
    }
    console.log('');

    return { jobs: allJobs, results };
  }

  // Filter jobs by Karnataka location
  filterKarnatakaJobs(jobs) {
    console.log(`\n📍 Filtering jobs for Karnataka, India...`);
    
    const karnatakaKeywords = [
      'karnataka',
      'bangalore',
      'bengaluru',
      'mysore',
      'mysuru',
      'mangalore',
      'mangaluru',
      'hubli',
      'hubballi',
      'belgaum',
      'belagavi',
      'tumkur',
      'davangere',
      'bellary',
      'ballari',
      'bijapur',
      'vijayapura',
      'shimoga',
      'shivamogga',
      'gulbarga',
      'kalaburagi',
      'raichur',
      'bidar',
      'chitradurga',
      'kolar',
      'mandya',
      'hassan',
      'dharwad',
      'udupi'
    ];

    // Locations/countries to explicitly reject
    const rejectKeywords = [
      'germany',
      'berlin',
      'munich',
      'hamburg',
      'usa',
      'united states',
      'new york',
      'san francisco',
      'california',
      'texas',
      'uk',
      'united kingdom',
      'london',
      'manchester',
      'canada',
      'toronto',
      'vancouver',
      'australia',
      'sydney',
      'melbourne',
      'singapore',
      'dubai',
      'uae',
      'europe',
      'asia' // Too broad, usually not India
    ];

    const filteredJobs = jobs.filter(job => {
      if (!job.location) {
        console.log(`❌ Rejected: No location - ${job.title}`);
        return false;
      }
      
      const location = job.location.toLowerCase();
      
      // First, reject any jobs with explicit non-India locations
      const hasRejectKeyword = rejectKeywords.some(keyword => 
        location.includes(keyword)
      );
      
      if (hasRejectKeyword) {
        console.log(`❌ Rejected (Foreign): ${job.title} - ${job.location}`);
        return false;
      }
      
      // Check if location contains any Karnataka city/keyword
      const hasKarnatakaKeyword = karnatakaKeywords.some(keyword => 
        location.includes(keyword)
      );
      
      if (hasKarnatakaKeyword) {
        console.log(`✅ Accepted (Karnataka): ${job.title} - ${job.location}`);
        return true;
      }
      
      // Accept ONLY remote jobs that explicitly mention India
      if (location.includes('india') && 
          (location.includes('remote') || job.workMode === 'Remote')) {
        console.log(`✅ Accepted (Remote India): ${job.title} - ${job.location}`);
        return true;
      }
      
      // Reject everything else (including generic "Remote" without India)
      console.log(`❌ Rejected (Not Karnataka): ${job.title} - ${job.location}`);
      return false;
    });

    console.log(`\n✅ Filtered: ${filteredJobs.length} Karnataka jobs (from ${jobs.length} total)`);
    console.log(`❌ Rejected: ${jobs.length - filteredJobs.length} non-Karnataka jobs`);
    return filteredJobs;
  }

  // Filter jobs by date (last 7 days)
  filterRecentJobs(jobs, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return jobs.filter(job => {
      const jobDate = new Date(job.postedDate);
      return jobDate >= cutoffDate;
    });
  }

  // Save jobs to database
  async saveJobsToDatabase(jobs) {
    console.log(`\n💾 Saving ${jobs.length} jobs to database...`);
    
    let savedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const jobData of jobs) {
      try {
        const existing = await ExternalJob.findOne({
          source: jobData.source,
          externalId: jobData.externalId
        });

        if (existing) {
          // Update existing job
          await ExternalJob.findByIdAndUpdate(existing._id, jobData, { new: true });
          updatedCount++;
        } else {
          // Create new job
          await ExternalJob.create(jobData);
          savedCount++;
        }
      } catch (error) {
        console.error(`Error saving job: ${jobData.title}`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Saved: ${savedCount} new jobs`);
    console.log(`🔄 Updated: ${updatedCount} existing jobs`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} jobs failed`);
    }

    return { savedCount, updatedCount, errorCount };
  }

  // Main method to fetch and save all jobs
  async fetchAndSaveAllJobs(options = {}) {
    try {
      const { jobs, results } = await this.aggregateAllJobs(options);
      
      if (jobs.length === 0) {
        console.log('\n⚠️  No jobs to save');
        return { success: false, message: 'No jobs fetched', results };
      }

      // Filter by Karnataka location first
      const karnatakaJobs = this.filterKarnatakaJobs(jobs);
      
      if (karnatakaJobs.length === 0) {
        console.log('\n⚠️  No Karnataka jobs found');
        return { success: false, message: 'No Karnataka jobs found', results };
      }
      
      // Then filter to only include jobs from last 7 days
      const recentJobs = this.filterRecentJobs(karnatakaJobs, 7);
      console.log(`\n📅 Filtered to ${recentJobs.length} recent jobs in Karnataka (from ${jobs.length} total)`);
      
      if (recentJobs.length === 0) {
        console.log('\n⚠️  No recent Karnataka jobs to save');
        return { success: false, message: 'No recent Karnataka jobs found', results };
      }

      const saveResults = await this.saveJobsToDatabase(recentJobs);
      
      return {
        success: true,
        message: `Successfully processed ${jobs.length} jobs`,
        aggregationResults: results,
        saveResults
      };
    } catch (error) {
      console.error('❌ Fatal error in job aggregation:', error.message);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
}

module.exports = new JobAggregatorService();
