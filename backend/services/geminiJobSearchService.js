/**
 * Gemini-based Job Search Service
 * Uses the generated AI prompt to search for jobs through Gemini
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const fs = require('fs');

class GeminiJobSearchService {
  constructor() {
    this.geminiAI = process.env.GEMINI_API_KEY ? 
      new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  }

  /**
   * Extract skills from resume text using simple keyword matching
   * @param {string} resumeText - The resume text
   * @returns {Promise<string[]>} Array of skills
   */
  async extractSkillsFromResume(resumeText) {
    try {
      // Common skills to look for
      const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express',
        'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#', '.NET',
        'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin',
        'HTML', 'CSS', 'SASS', 'SCSS', 'Bootstrap', 'Tailwind',
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'CI/CD', 'DevOps',
        'Machine Learning', 'AI', 'Data Science', 'Analytics', 'TensorFlow', 'PyTorch',
        'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
      ];

      const extractedSkills = [];
      const resumeLower = resumeText.toLowerCase();

      commonSkills.forEach(skill => {
        if (resumeLower.includes(skill.toLowerCase())) {
          extractedSkills.push(skill);
        }
      });

      // If no skills found, return some default skills
      if (extractedSkills.length === 0) {
        return ['JavaScript', 'HTML', 'CSS', 'Communication', 'Problem Solving'];
      }

      // Limit to 10 skills maximum
      return extractedSkills.slice(0, 10);
    } catch (error) {
      console.error('Error extracting skills from resume:', error);
      return ['JavaScript', 'HTML', 'CSS', 'Communication', 'Problem Solving'];
    }
  }

  /**
   * Generate the job search prompt
   * @param {Object} params - Job search parameters
   * @returns {string} The formatted prompt
   */
  generateJobSearchPrompt(params) {
    const { city, job_position, years_of_experience, skills } = params;
    
    return `SYSTEM:
You are Gemini 2.5 Pro, an expert job-aggregation agent with web access. Your job: actively search and scrape job postings to find the best matches for a candidate. Obey robots.txt, rate limits, and site terms. If blocked or disallowed from scraping a source, note it in status.unavailable_sources and continue. Include last 24 hours of job posting. Return JSON only (see schema below), then a 6-line human summary. Do not include any other commentary.

USER:
Inputs:
- city: "${city}"
- job_position: "${job_position}"
- years_of_experience: ${years_of_experience}
- candidate_skills: [${skills.map(s => `"${s}"`).join(', ')}]

Instructions (do these exactly):
1) Actively search and scrape job postings from as many sources as possible (LinkedIn, Naukri, Indeed, Glassdoor, Monster, AngelList/Wellfound, company career pages, GitHub/StackOverflow jobs, regional portals, government portals, recruitment agencies, alumni boards, and major aggregators/APIs). Try to follow links from aggregator results to original company pages when available.
2) For each posting capture: id, title, company, location_city, is_remote (Yes|No|Hybrid), posting_date (YYYY-MM-DD), skills_required (list), min_experience, max_experience, salary_range (if present), job_description_snippet (<=300 chars), application_url, source (domain), other_sources (list), full_raw_text or summary if very long.
3) Filter: if city != "Any", include only jobs in that Karnataka city. If city == "Any", include jobs across Karnataka only. Prioritize postings in the last 24 hours.
4) Deduplicate identical postings (same title+company+url or same unique job id). Keep the most complete record and list other_sources.
5) Compute match_score (0–100) per posting using skill overlap from 'candidate_skills', title similarity, experience fit, location, and recency. Include missing_skills (important skills not in the candidate's skill list). Provide why_matched (1–2 sentences).
6) Rank by match_score desc and return top 10.
7) If live web access is unavailable for any source, include it in status.unavailable_sources and continue.
8) Respect privacy & legality: do not disclose scraping credentials or private API keys.

OUTPUT: return valid JSON only using this top-level schema (no extra text before JSON):
{
  "jobs": [ up to 10 job objects as described above ]
}`;
  }

  /**
   * Process job search request using Gemini
   * @param {Object} params - Job search parameters
   * @returns {Promise<Object>} Job search results
   */
  async searchJobs(params) {
    if (!this.geminiAI) {
      throw new Error('Gemini API is not configured');
    }

    console.log('🔍 Starting Gemini job search...');
    const startTime = Date.now();

    try {
      // Extract skills from resume
      const skills = await this.extractSkillsFromResume(params.resumeText);
      console.log(`🛠️ Extracted skills: ${skills.join(', ')}`);

      // Generate the prompt
      const prompt = this.generateJobSearchPrompt({
        city: params.city,
        job_position: params.job_position,
        years_of_experience: params.years_of_experience,
        skills: skills
      });

      console.log('📝 Sending prompt to Gemini...');

      // Get Gemini model
      const model = this.geminiAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 8192,
        },
      });

      // Send request to Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Raw Gemini response length:', text.length);
      console.log('🔍 Full Gemini response:', text);

      // Try to extract JSON from the response
      let jobData;
      try {
        // Look for JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('✅ Found JSON in response:', jsonMatch[0].substring(0, 200) + '...');
          jobData = JSON.parse(jsonMatch[0]);
        } else {
          console.log('❌ No JSON found in response. Full response:');
          console.log(text);
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Gemini response:', parseError.message);
        console.log('📄 Full response text:');
        console.log(text);
        
        // Return a fallback response
        jobData = {
          jobs: [{
            id: 'fallback-1',
            title: 'Software Engineer',
            company: 'Sample Company',
            location_city: params.city,
            is_remote: 'No',
            posting_date: new Date().toISOString().split('T')[0],
            skills_required: skills.slice(0, 3),
            min_experience: Math.max(0, parseInt(params.years_of_experience) - 1),
            max_experience: parseInt(params.years_of_experience) + 2,
            salary_range: 'Not specified',
            job_description_snippet: 'AI was unable to find specific jobs. This is a sample result. Please try adjusting your search criteria.',
            application_url: '#',
            source: 'fallback',
            other_sources: [],
            match_score: 75,
            missing_skills: [],
            why_matched: 'Sample job based on your criteria.'
          }]
        };
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Job search completed in ${processingTime}s`);

      // Process and format the results
      const jobs = jobData.jobs || [];
      console.log(`📊 Found ${jobs.length} job recommendations`);

      return {
        success: true,
        recommendations: jobs.map(job => ({
          id: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: job.title,
          company: job.company,
          location: job.location_city || params.city,
          description: job.job_description_snippet || job.description || 'No description available',
          matchScore: job.match_score || 80,
          relevanceScore: job.match_score || 80,
          matchingSkills: job.skills_required || skills.slice(0, 3),
          missingSkills: job.missing_skills || [],
          whyMatched: job.why_matched || 'Good match based on your profile',
          externalUrl: job.application_url && job.application_url !== '#' ? job.application_url : null,
          salary: job.salary_range,
          experience: job.min_experience && job.max_experience ? 
            `${job.min_experience}-${job.max_experience} years` : 'Not specified',
          remote: job.is_remote,
          postedDate: job.posting_date,
          source: job.source || 'gemini'
        })),
        userProfile: {
          skills: skills,
          experienceLevel: this.getExperienceLevel(params.years_of_experience),
          experience: params.years_of_experience
        },
        stats: {
          totalJobsFound: jobs.length,
          processingTime: `${processingTime}s`
        },
        processingTime: `${processingTime}s`
      };

    } catch (error) {
      console.error('❌ Gemini job search failed:', error);
      throw new Error(`Job search failed: ${error.message}`);
    }
  }

  /**
   * Determine experience level based on years
   * @param {number} years - Years of experience
   * @returns {string} Experience level
   */
  getExperienceLevel(years) {
    const yearsNum = parseInt(years);
    if (yearsNum <= 1) return 'entry';
    if (yearsNum <= 3) return 'junior';
    if (yearsNum <= 6) return 'mid';
    if (yearsNum <= 10) return 'senior';
    return 'lead';
  }
}

module.exports = new GeminiJobSearchService();