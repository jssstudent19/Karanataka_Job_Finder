/**
 * AI-Powered Job Recommendation Service
 * Fetches jobs from Apify on-demand and uses AI to filter and match jobs based on resume analysis
 */

const { ApifyClient } = require('apify-client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExternalJob = require('../src/models/ExternalJob');

class AIJobRecommendationService {
  constructor() {
    this.apifyClient = process.env.APIFY_API_TOKEN ? 
      new ApifyClient({ token: process.env.APIFY_API_TOKEN }) : null;
    
    this.geminiAI = process.env.GEMINI_API_KEY ? 
      new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  }

  /**
   * Main function to get AI-powered job recommendations
   * @param {Object} params - Search parameters
   * @param {string} params.country - Country code (e.g., 'IN')
   * @param {string} params.position - Job position/title
   * @param {string} params.location - Location
   * @param {string} params.experience - Years of experience
   * @param {string} params.resumeText - Extracted resume text
   * @returns {Promise<Object>} Recommendations with AI scoring
   */
  async getJobRecommendations(params) {
    console.log('🚀 Starting AI Job Recommendation Process...');
    const startTime = Date.now();

    try {
      // Step 1: Extract comprehensive skills from resume using AI
      console.log('1️⃣ Analyzing resume with AI...');
      const userProfile = await this.analyzeResumeWithAI(params.resumeText, params.experience);
      console.log(`📄 User Profile: ${userProfile.experienceLevel} level (${userProfile.experience} years)`);
      console.log(`🛠️ Skills found: ${userProfile.skills.slice(0, 5).join(', ')}${userProfile.skills.length > 5 ? '...' : ''}`);
      console.log(`🎯 Preferred roles: ${userProfile.preferredRoles.join(', ')}`);
      
      
      // Step 2: Fetch fresh jobs from Indeed via Apify
      console.log('2️⃣ Fetching fresh jobs from Indeed...');
      const freshJobs = await this.fetchFreshJobs({
        country: params.country,
        position: params.position,
        location: params.location
      });

      // Step 3: Pre-filter jobs and use AI on most promising ones
      console.log('3️⃣ Pre-filtering and AI analysis of promising jobs...');
      
      // First, do basic scoring to pre-filter
      const preScored = freshJobs.map(job => ({
        ...job,
        basicScore: this.basicJobScore(job, userProfile)
      }));
      
      // Only AI-analyze top 12 jobs to stay within rate limits
      const topJobs = preScored
        .sort((a, b) => b.basicScore - a.basicScore)
        .slice(0, 12);
      
      console.log(`📊 Pre-filtering: ${freshJobs.length} jobs → ${topJobs.length} for AI analysis`);
      
      const scoredJobs = await this.scoreJobsWithAI(topJobs, userProfile);
      
      // Add remaining jobs with basic scoring
      const remainingJobs = preScored
        .slice(12)
        .map(job => ({
          ...job,
          aiScore: job.basicScore,
          matchingSkills: this.findMatchingSkills(job, userProfile.skills),
          matchReasons: [`Basic score: ${job.basicScore}%`]
        }));
      
      const allScoredJobs = [...scoredJobs, ...remainingJobs];
      
      // Log job scores for debugging
      console.log('📊 Job Scores Summary:');
      allScoredJobs.forEach(job => {
        console.log(`  ${job.title} (${job.company}): ${job.aiScore}% match`);
      });
      
      // Step 4: Filter and sort jobs - comprehensive filtering for experience levels
      let filteredJobs = allScoredJobs;
      
      // Enhanced filtering for entry-level candidates
      if (userProfile.experienceLevel === 'entry') {
        filteredJobs = scoredJobs.filter(job => {
          const jobTitle = job.title.toLowerCase();
          const jobDescription = (job.description || '').toLowerCase();
          const jobText = `${jobTitle} ${jobDescription}`;
          
          // Check for senior-level indicators in title
          const hasSeniorTitle = jobTitle.includes('senior') || jobTitle.includes('lead') || 
                                jobTitle.includes('principal') || jobTitle.includes('manager') ||
                                jobTitle.includes(' ii') || jobTitle.includes(' 2') ||
                                jobTitle.includes(' iii') || jobTitle.includes(' 3') ||
                                /\bii\b/.test(jobTitle) || /\biii\b/.test(jobTitle) ||
                                jobTitle.includes('engineer ii') || jobTitle.includes('developer ii') ||
                                jobTitle.includes('dev engineer ii') || jobTitle.includes('sde ii');
          
          // Check for experience requirements in description
          const hasExperienceRequirement = jobText.includes('3+ years') || jobText.includes('4+ years') ||
                                           jobText.includes('5+ years') || jobText.includes('3-5 years') ||
                                           jobText.includes('2-4 years') || jobText.includes('4-6 years') ||
                                           jobText.includes('minimum 3') || jobText.includes('minimum 2') ||
                                           jobText.includes('at least 3') || jobText.includes('at least 2') ||
                                           jobText.includes('experienced professional') ||
                                           jobText.includes('proven track record');
          
          // Also filter by AI score - if AI gave very low score, don't show it
          const hasLowAIScore = job.aiScore < 25;
          
          if (hasSeniorTitle || hasExperienceRequirement || hasLowAIScore) {
            console.log(`🚫 Filtering out "${job.title}" for entry-level candidate:`);
            if (hasSeniorTitle) console.log(`   - Senior title detected`);
            if (hasExperienceRequirement) console.log(`   - Experience requirement found`);
            if (hasLowAIScore) console.log(`   - AI score too low (${job.aiScore})`);
            return false;
          }
          return true;
        });
      }
      
      const allRecommendations = filteredJobs
        .sort((a, b) => b.aiScore - a.aiScore) // Higher scores first
        .slice(0, 20); // Up to 20 jobs

      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`✅ Process complete in ${processingTime}s - Found ${allRecommendations.length} job opportunities`);
      console.log(`🎆 Showing all jobs sorted by relevance for ${userProfile.experienceLevel} level candidate`);

      return {
        success: true,
        processingTime: `${processingTime}s`,
        userProfile,
        recommendations: allRecommendations,
        stats: {
          totalJobsFetched: freshJobs.length,
          jobsAnalyzed: allScoredJobs.length,
          aiAnalyzedJobs: scoredJobs.length,
          basicScoredJobs: remainingJobs.length,
          recommendationsReturned: allRecommendations.length
        }
      };

    } catch (error) {
      console.error('❌ Job recommendation failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        processingTime: Math.round((Date.now() - startTime) / 1000) + 's',
        recommendations: []
      };
    }
  }

  /**
   * Analyze resume using AI to extract comprehensive profile
   * @param {string} resumeText - Resume content
   * @param {string} experience - Years of experience
   * @returns {Promise<Object>} User profile with skills, experience, etc.
   */
  async analyzeResumeWithAI(resumeText, experience) {
    if (!this.geminiAI) {
      console.log('⚠️ Gemini not configured, using basic analysis');
      return this.basicResumeAnalysis(resumeText, experience);
    }

    try {
      const model = this.geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
      
      const prompt = `
Analyze this resume and extract a comprehensive professional profile in JSON format:

RESUME:
${resumeText}

ADDITIONAL INFO:
- Years of experience: ${experience}

Extract and return ONLY a JSON object:
{
  "skills": ["list of ALL technical and professional skills found"],
  "experience": "${experience}",
  "experienceLevel": "entry|junior|mid|senior|lead|executive",
  "domains": ["industry domains/sectors"],
  "jobRoles": ["specific job roles/titles mentioned"],
  "technologies": ["programming languages, frameworks, tools"],
  "certifications": ["any certifications mentioned"],
  "education": "highest education level",
  "keyStrengths": ["top 5 professional strengths"],
  "preferredRoles": ["ideal job roles based on profile"]
}

Rules:
- Include ALL skills found in resume
- Map experience years to level: 0-1=entry, 2-3=junior, 4-6=mid, 7-10=senior, 11-15=lead, 15+=executive
- Be comprehensive but accurate
- Return valid JSON only
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const profile = JSON.parse(jsonMatch[0]);
        console.log('✅ AI Resume Analysis Complete');
        return profile;
      }

      throw new Error('No valid JSON in AI response');

    } catch (error) {
      console.error('❌ AI resume analysis failed:', error.message);
      return this.basicResumeAnalysis(resumeText, experience);
    }
  }

  /**
   * Score jobs using AI analysis
   * @param {Array} jobs - Array of job objects  
   * @param {Object} userProfile - User profile from resume analysis
   * @returns {Promise<Array>} Jobs with AI scores
   */
  async scoreJobsWithAI(jobs, userProfile) {
    if (!this.geminiAI || jobs.length === 0) {
      console.log('⚠️ Using basic scoring');
      return jobs.map(job => ({
        ...job,
        aiScore: this.basicJobScore(job, userProfile),
        matchingSkills: this.findMatchingSkills(job, userProfile.skills),
        matchReasons: [`Experience level match: ${userProfile.experienceLevel}`]
      }));
    }

    const scoredJobs = [];
    
    console.log(`🤖 AI analyzing ${jobs.length} jobs...`);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`📊 Analyzing job ${i + 1}/${jobs.length}: ${job.title}`);

      try {
        const aiAnalysis = await this.analyzeJobWithAI(job, userProfile);
        scoredJobs.push({
          ...job,
          aiScore: aiAnalysis.score,
          matchingSkills: aiAnalysis.matchingSkills,
          matchReasons: aiAnalysis.reasons,
          aiInsights: aiAnalysis.insights
        });
        
        // No delay - rely on fallback scoring for rate limits
        
      } catch (error) {
        console.error(`❌ AI analysis failed for job: ${job.title}`, error.message);
        
        // Fallback to basic scoring
        scoredJobs.push({
          ...job,
          aiScore: this.basicJobScore(job, userProfile),
          matchingSkills: this.findMatchingSkills(job, userProfile.skills),
          matchReasons: ['Basic matching applied']
        });
      }
    }

    return scoredJobs;
  }

  /**
   * Analyze a single job with AI
   */
  async analyzeJobWithAI(job, userProfile) {
    const model = this.geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
    
    // Include ALL available job fields in the analysis
    const jobData = {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salary: job.salary,
      jobType: job.jobType,
      postedAt: job.postedAt,
      rating: job.rating,
      source: job.source,
      // Include any other fields from Apify
      ...job
    };
    
    const prompt = `
Analyze this job posting against the candidate profile and provide a detailed match score.

COMPLETE JOB POSTING DATA:
${JSON.stringify(jobData, null, 2)}

CANDIDATE PROFILE:
- Skills: ${userProfile.skills.join(', ')}
- Years of Experience: ${userProfile.experience} years
- Experience Level: ${userProfile.experienceLevel}
- Technologies: ${userProfile.technologies.join(', ')}
- Job Roles: ${userProfile.jobRoles.join(', ')}
- Preferred Roles: ${userProfile.preferredRoles.join(', ')}
- Education: ${userProfile.education}
- Key Strengths: ${userProfile.keyStrengths.join(', ')}

IMPORTANT ANALYSIS RULES:
1. EXPERIENCE LEVEL MATCHING (Critical - 40 points):
   CAREFULLY ANALYZE BOTH JOB TITLE AND DESCRIPTION FOR EXPERIENCE REQUIREMENTS:
   
   - For "entry" (0-1 years): 
     * Job titles: "intern", "trainee", "fresher", "entry-level", "graduate", "junior" (without II/2/III/3)
     * Description should NOT mention: "3+ years", "5+ years", "experienced", "senior", etc.
     * Look for: "fresh graduates", "0-1 years", "entry level", "no experience required"
     * REJECT if description says "minimum 3 years", "3-5 years", "II/2", "III/3" in title
   
   - For "junior" (2-3 years):
     * Job titles: "junior", "associate", "software engineer" (without senior/II/III)
     * Description: "1-3 years", "2-4 years" experience
     * REJECT if requires "5+ years" or has "senior" in title
   
   - For "mid" (4-6 years):
     * Job titles: "software engineer II", "SDE II", "experienced", some "senior" roles
     * Description: "3-6 years", "4-7 years" experience
   
   - For "senior" (7-10 years):
     * Job titles: "senior", "lead", "SDE III", "principal" (some)
     * Description: "5+ years", "7+ years" experience
   
   - For "lead" (11+ years):
     * Job titles: "lead", "principal", "architect", "manager"
     * Description: "8+ years", "10+ years" experience
   
   EXAMPLES OF MISMATCHES TO HEAVILY PENALIZE:
   - Entry level candidate + "Software Dev Engineer II" + "3-5 years experience" = SCORE 0-20
   - Entry level candidate + "Senior" in title = SCORE 0-15
   - Entry level candidate + Description mentions "minimum 3 years" = SCORE 0-25
   
2. SKILLS MATCHING (30 points):
   - Exact skill matches in job description
   - Technology stack alignment
   - Domain expertise overlap
   
3. ROLE ALIGNMENT (20 points):
   - Job title matches preferred roles
   - Responsibilities match experience level
   - Career progression appropriateness
   
4. ADDITIONAL FACTORS (10 points):
   - Location preference
   - Company rating/reputation
   - Salary appropriateness for experience level

SCORING GUIDELINES:
- SEVERE EXPERIENCE MISMATCH (fresher for 3+ years role, entry for senior/II/III roles): SCORE 0-20
- MODERATE EXPERIENCE MISMATCH (junior for senior role, mid for entry role): SCORE 20-40  
- EXPERIENCE LEVEL APPROPRIATE but skills don't match well: SCORE 40-60
- GOOD EXPERIENCE LEVEL + some skill matches: SCORE 60-80
- PERFECT EXPERIENCE LEVEL + strong skill matches: SCORE 80-100

KEY INDICATORS TO CHECK:
- Title contains "II", "III", "2", "3" = Usually requires 2+ years experience
- Title contains "Senior", "Lead", "Principal" = Usually requires 5+ years
- Description explicitly states experience requirements (e.g., "3-5 years", "minimum 3 years")
- Description uses terms like "experienced professional", "proven track record"

FOR FRESHER CANDIDATES:
- ONLY recommend jobs that say "Fresher", "Entry Level", "Graduate", "0-1 years", or similar
- If a job mentions ANY years of experience (2+, 3+, etc.) in title OR description, score it 0-15 for freshers
- Even if skills match perfectly, experience mismatch for freshers should result in very low scores

Return ONLY JSON:
{
  "score": 85,
  "matchingSkills": ["skill1", "skill2"],
  "reasons": ["Specific reason for match/mismatch", "Experience level analysis", "Skill alignment details"],
  "insights": "Detailed explanation of why this job is appropriate or inappropriate for this candidate's experience level and skills",
  "experienceMatch": "perfect|good|fair|poor",
  "skillsMatch": "excellent|good|fair|poor"
}

Return valid JSON only.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No valid JSON in AI response');
  }

  /**
   * Basic job scoring without AI
   */
  basicJobScore(job, userProfile) {
    let score = 0;
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    const userSkills = userProfile.skills.map(s => s.toLowerCase());
    const expLevel = userProfile.experienceLevel;
    const experienceYears = parseInt(userProfile.experience) || 0;

    // Experience Level Matching (40 points) - More strict
    let experienceScore = 0;
    const hasExperienceRequirement = 
      jobText.includes('years') || 
      jobText.includes('experience') ||
      jobTitle.includes('senior') ||
      jobTitle.includes('junior') ||
      jobTitle.includes('lead') ||
      jobTitle.includes('principal');

    if (expLevel === 'entry') {
      // Entry level should only match entry/junior/fresher roles
      if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal') || 
          jobTitle.includes('manager') || jobTitle.includes(' ii') || jobTitle.includes(' iii') ||
          /\bii\b/.test(jobTitle) || /\biii\b/.test(jobTitle) || jobTitle.includes('staff')) {
        experienceScore = 0; // Heavy penalty for senior/level II+ roles
      } else if (jobTitle.includes('junior') || jobTitle.includes('fresher') || jobTitle.includes('entry') || 
                 jobTitle.includes('trainee') || jobTitle.includes('intern') || jobTitle.includes('associate')) {
        experienceScore = 40;
      } else if (jobText.includes('3+ years') || jobText.includes('4+ years') || jobText.includes('5+ years') ||
                 jobText.includes('3-5 years') || jobText.includes('minimum 3') || jobText.includes('experienced')) {
        experienceScore = 5; // Very low for explicit experience requirements
      } else if (!hasExperienceRequirement) {
        experienceScore = 25; // Some credit for unclear requirements
      } else {
        experienceScore = 10; // Low score for other roles
      }
    } else if (expLevel === 'junior') {
      if (jobTitle.includes('senior') || jobTitle.includes('lead')) {
        experienceScore = 5; // Low score for senior roles
      } else if (jobTitle.includes('junior') || jobTitle.includes('associate')) {
        experienceScore = 40;
      } else if (!jobTitle.includes('senior')) {
        experienceScore = 30;
      }
    } else if (expLevel === 'mid') {
      if (jobTitle.includes('junior') || jobTitle.includes('fresher')) {
        experienceScore = 15; // Lower score for junior roles
      } else if (jobTitle.includes('senior') && !jobTitle.includes('lead')) {
        experienceScore = 35;
      } else {
        experienceScore = 40;
      }
    } else if (expLevel === 'senior') {
      if (jobTitle.includes('junior') || jobTitle.includes('fresher')) {
        experienceScore = 5; // Very low for junior roles
      } else if (jobTitle.includes('senior') || jobTitle.includes('lead')) {
        experienceScore = 40;
      } else {
        experienceScore = 25;
      }
    } else if (expLevel === 'lead') {
      if (jobTitle.includes('junior') || jobTitle.includes('associate')) {
        experienceScore = 0; // No match for junior roles
      } else if (jobTitle.includes('lead') || jobTitle.includes('principal') || jobTitle.includes('architect')) {
        experienceScore = 40;
      } else if (jobTitle.includes('senior')) {
        experienceScore = 30;
      } else {
        experienceScore = 15;
      }
    }

    score += experienceScore;

    // Skills matching (35 points)
    if (userSkills.length > 0) {
      const matchingSkills = userSkills.filter(skill => jobText.includes(skill));
      score += (matchingSkills.length / userSkills.length) * 35;
    }

    // Role alignment (25 points)
    const roleMatch = userProfile.preferredRoles.some(role => 
      jobTitle.includes(role.toLowerCase())
    );
    if (roleMatch) score += 25;

    // If this is clearly a mismatch (fresher for senior role), cap the score low
    if (expLevel === 'entry' && (jobTitle.includes('senior') || jobTitle.includes('lead'))) {
      score = Math.min(score, 25);
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Find matching skills between job and user profile
   */
  findMatchingSkills(job, userSkills) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    return userSkills.filter(skill => jobText.includes(skill.toLowerCase())).slice(0, 8);
  }

  /**
   * Legacy method - create simple user profile from provided data
   * @param {string} experience - Years of experience
   * @param {string} skills - Comma-separated skills
   * @returns {Object} User profile
   */
  createUserProfile(experience, skills) {
    const skillsList = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.toLowerCase());

    // Determine experience level
    const expNum = parseInt(experience) || 0;
    let experienceLevel = 'mid';
    if (expNum <= 1) experienceLevel = 'entry';
    else if (expNum <= 3) experienceLevel = 'junior';
    else if (expNum <= 6) experienceLevel = 'mid';
    else if (expNum <= 10) experienceLevel = 'senior';
    else experienceLevel = 'lead';

    return {
      skills: skillsList,
      experience,
      experienceLevel,
      skillsCount: skillsList.length
    };
  }

  /**
   * Filter jobs based on user skills
   * @param {Array} jobs - Array of job objects
   * @param {Array} userSkills - User's skills array
   * @returns {Array} Filtered jobs with match scores
   */
  filterJobsBySkills(jobs, userSkills) {
    return jobs
      .map(job => {
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        
        // Find matching skills
        const matchingSkills = userSkills.filter(skill => 
          jobText.includes(skill.toLowerCase())
        );
        
        // Calculate simple match score
        const matchScore = userSkills.length > 0 
          ? Math.round((matchingSkills.length / userSkills.length) * 100)
          : 50; // Default score if no skills provided
        
        return {
          ...job,
          matchingSkills: matchingSkills.slice(0, 5), // Show top 5 matches
          matchScore,
          relevantSkills: matchingSkills.length > 0
        };
      })
      .filter(job => job.relevantSkills || userSkills.length === 0) // Show all if no skills, or only relevant ones
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
  }


  /**
   * Fallback resume analysis without AI
   */
  basicResumeAnalysis(resumeText, experience, manualSkills) {
    const text = resumeText.toLowerCase();
    
    // Extract skills using keyword matching
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue.js',
      'html', 'css', 'typescript', 'mongodb', 'mysql', 'postgresql', 'redis',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins', 'linux',
      'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
      'project management', 'agile', 'scrum', 'leadership', 'communication'
    ];

    const foundSkills = skillKeywords.filter(skill => text.includes(skill));
    
    // Add manual skills
    if (manualSkills) {
      const manualSkillsList = manualSkills.split(',').map(s => s.trim().toLowerCase());
      foundSkills.push(...manualSkillsList);
    }

    // Determine experience level
    const expNum = parseInt(experience) || 0;
    let experienceLevel = 'mid';
    if (expNum <= 1) experienceLevel = 'entry';
    else if (expNum <= 3) experienceLevel = 'junior';
    else if (expNum <= 6) experienceLevel = 'mid';
    else if (expNum <= 10) experienceLevel = 'senior';
    else if (expNum <= 15) experienceLevel = 'lead';
    else experienceLevel = 'executive';

    return {
      skills: [...new Set(foundSkills)], // Remove duplicates
      experience,
      experienceLevel,
      domains: ['Technology'],
      jobRoles: ['Software Engineer'],
      technologies: foundSkills.filter(skill => 
        ['javascript', 'python', 'java', 'react', 'node.js'].includes(skill)
      ),
      certifications: [],
      education: 'Bachelor\'s',
      keyStrengths: foundSkills.slice(0, 5),
      preferredRoles: ['Software Engineer', 'Developer']
    };
  }

  /**
   * Fetch fresh jobs from Indeed via Apify
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Array of job objects
   */
  async fetchFreshJobs(params) {
    if (!this.apifyClient) {
      console.log('⚠️ Apify not configured, returning mock jobs');
      return this.getMockJobs(params);
    }

    try {
      const input = {
        country: params.country,
        location: params.location,
        position: params.position,
        maxItems: 20,
        saveOnlyUniqueItems: true,
        maxConcurrency: 5
      };

      console.log('🎬 Starting Indeed scraper with:', input);
      
      const run = await this.apifyClient.actor('misceres/indeed-scraper').call(input);
      
      if (run.status === 'SUCCEEDED') {
        const { items } = await this.apifyClient.run(run.id).dataset().listItems();
        console.log(`✅ Fetched ${items.length} jobs from Indeed`);
        
        return items.map(job => this.normalizeIndeedJob(job));
      } else {
        throw new Error(`Actor run failed: ${run.status}`);
      }

    } catch (error) {
      console.error('❌ Apify fetch failed:', error.message);
      return this.getMockJobs(params);
    }
  }

  /**
   * Normalize Indeed job data
   */
  normalizeIndeedJob(job) {
    return {
      id: job.id,
      title: job.positionName || job.title || 'Unknown Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Unknown Location',
      description: job.description || 'No description available',
      externalUrl: job.url || job.externalApplyLink,
      salary: job.salary,
      jobType: Array.isArray(job.jobType) ? job.jobType.join(', ') : job.jobType,
      postedAt: job.postedAt,
      rating: job.rating,
      source: 'Indeed'
    };
  }

  /**
   * Score jobs using AI analysis
   * @param {Array} jobs - Array of job objects  
   * @param {Object} userProfile - User profile from resume analysis
   * @returns {Promise<Array>} Jobs with AI scores
   */
  async scoreJobsWithAI(jobs, userProfile) {
    if (!this.geminiAI || jobs.length === 0) {
      console.log('⚠️ Using basic scoring');
      return jobs.map(job => ({
        ...job,
        aiScore: this.basicJobScore(job, userProfile),
        matchingSkills: this.findMatchingSkills(job, userProfile.skills),
        matchReasons: [`Experience level match: ${userProfile.experienceLevel}`]
      }));
    }

    const scoredJobs = [];
    
    console.log(`🤖 AI analyzing ${jobs.length} jobs...`);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`📊 Analyzing job ${i + 1}/${jobs.length}: ${job.title}`);

      try {
        const aiAnalysis = await this.analyzeJobWithAI(job, userProfile);
        scoredJobs.push({
          ...job,
          aiScore: aiAnalysis.score,
          matchingSkills: aiAnalysis.matchingSkills,
          matchReasons: aiAnalysis.reasons,
          aiInsights: aiAnalysis.insights
        });
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ AI analysis failed for job: ${job.title}`, error.message);
        
        // Fallback to basic scoring
        scoredJobs.push({
          ...job,
          aiScore: this.basicJobScore(job, userProfile),
          matchingSkills: this.findMatchingSkills(job, userProfile.skills),
          matchReasons: ['Basic matching applied']
        });
      }
    }

    return scoredJobs;
  }

  /**
   * Analyze a single job with AI
   */
  async analyzeJobWithAI(job, userProfile) {
    const model = this.geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `
Analyze this job against the candidate profile and provide a match score.

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description.substring(0, 1500)}...

CANDIDATE PROFILE:
Skills: ${userProfile.skills.join(', ')}
Experience: ${userProfile.experience} years (${userProfile.experienceLevel})
Technologies: ${userProfile.technologies.join(', ')}
Preferred Roles: ${userProfile.preferredRoles.join(', ')}

Return ONLY JSON:
{
  "score": 85,
  "matchingSkills": ["skill1", "skill2"],
  "reasons": ["reason for good match", "another reason"],
  "insights": "Brief insight about why this is a good/bad match"
}

Scoring criteria (0-100):
- Skills match: 40 points
- Experience level fit: 30 points  
- Role alignment: 20 points
- Company/culture fit: 10 points

Return valid JSON only.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No valid JSON in AI response');
  }

  /**
   * Basic job scoring without AI
   */
  basicJobScore(job, userProfile) {
    let score = 0;
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const userSkills = userProfile.skills.map(s => s.toLowerCase());

    // Skills matching (60 points)
    const matchingSkills = userSkills.filter(skill => jobText.includes(skill));
    score += (matchingSkills.length / userSkills.length) * 60;

    // Title matching (25 points)
    const titleMatch = userProfile.preferredRoles.some(role => 
      job.title.toLowerCase().includes(role.toLowerCase())
    );
    if (titleMatch) score += 25;

    // Experience level (15 points)
    const jobTextLower = jobText;
    const expLevel = userProfile.experienceLevel;
    if (
      (expLevel === 'entry' && (jobTextLower.includes('junior') || jobTextLower.includes('fresher'))) ||
      (expLevel === 'junior' && jobTextLower.includes('junior')) ||
      (expLevel === 'mid' && (jobTextLower.includes('senior') || jobTextLower.includes('experienced'))) ||
      (expLevel === 'senior' && jobTextLower.includes('senior'))
    ) {
      score += 15;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Find matching skills between job and user profile
   */
  findMatchingSkills(job, userSkills) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    return userSkills.filter(skill => jobText.includes(skill.toLowerCase())).slice(0, 8);
  }

  /**
   * Generate mock jobs for testing
   */
  getMockJobs(params) {
    return [
      {
        id: 'mock-1',
        title: `Senior ${params.position}`,
        company: 'TechCorp India',
        location: params.location,
        description: `We are seeking a ${params.position} with expertise in modern technologies. Must have strong problem-solving skills and experience with JavaScript, Python, React, and cloud platforms.`,
        externalUrl: 'https://example.com/job1',
        salary: '₹8-15 LPA',
        jobType: 'Full-time',
        source: 'Mock'
      },
      {
        id: 'mock-2', 
        title: `${params.position} - Remote`,
        company: 'StartupXYZ',
        location: `Remote, ${params.location}`,
        description: `Remote ${params.position} position requiring Node.js, MongoDB, AWS experience. Great opportunity to work with cutting-edge technology stack.`,
        externalUrl: 'https://example.com/job2',
        salary: '₹6-12 LPA',
        jobType: 'Full-time',
        source: 'Mock'
      }
    ];
  }
}

module.exports = new AIJobRecommendationService();