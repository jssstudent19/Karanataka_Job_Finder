/**
 * Job Recommendation Service
 * Main service for on-demand job recommendations based on resume analysis
 */

const geminiResumeParser = require('./geminiResumeParser');
const apifyActorTrigger = require('./apifyActorTrigger');

class JobRecommendationService {
  /**
   * Get job recommendations based on resume and desired role
   * @param {string} resumeText - Extracted text from resume
   * @param {string} desiredRole - User-specified desired role
   * @returns {Promise<Object>} Recommendations and analysis
   */
  async getRecommendations(resumeText, desiredRole = '') {
    console.log('\n🎯 Starting job recommendation process...');
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    console.log(`💼 Desired role: ${desiredRole || 'Not specified'}`);

    try {
      // Step 1: Parse resume to extract preferences
      console.log('\n1️⃣ Parsing resume with Gemini...');
      const jobPreferences = await geminiResumeParser.parseResume(resumeText, desiredRole);
      
      console.log('✅ Resume parsed successfully:', {
        role: jobPreferences.role,
        experience: jobPreferences.experience,
        skills: jobPreferences.skills,
        experienceYears: jobPreferences.experienceYears
      });

      // Step 2: Get LinkedIn job recommendations via Apify
      console.log('\n2️⃣ Fetching LinkedIn jobs via Apify...');
      const startTime = Date.now();
      
      const jobRecommendations = await apifyActorTrigger.getJobRecommendations(jobPreferences);
      
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Job recommendations complete in ${processingTime}s`);

      // Step 3: Generate search keywords for additional searches
      const searchKeywords = geminiResumeParser.generateSearchKeywords(jobPreferences);

      // Step 4: Compile final response
      const response = {
        success: true,
        processingTimeSeconds: processingTime,
        analysis: {
          extractedRole: jobPreferences.role,
          experienceLevel: jobPreferences.experience,
          experienceYears: jobPreferences.experienceYears,
          skills: jobPreferences.skills,
          industry: jobPreferences.industry,
          location: jobPreferences.location
        },
        searchKeywords,
        recommendations: {
          count: jobRecommendations.length,
          jobs: jobRecommendations,
          averageRelevanceScore: this.calculateAverageScore(jobRecommendations)
        },
        metadata: {
          source: 'linkedin-apify',
          requestedAt: new Date(),
          location: 'Karnataka, India'
        }
      };

      console.log(`\n🎉 Recommendation process complete!`);
      console.log(`📊 Found ${jobRecommendations.length} relevant jobs`);
      console.log(`⭐ Average relevance: ${response.recommendations.averageRelevanceScore}%`);

      return response;

    } catch (error) {
      console.error('❌ Error in recommendation process:', error.message);
      
      return {
        success: false,
        error: error.message,
        fallback: true,
        analysis: null,
        recommendations: {
          count: 0,
          jobs: [],
          averageRelevanceScore: 0
        },
        metadata: {
          source: 'error',
          requestedAt: new Date(),
          error: error.message
        }
      };
    }
  }

  /**
   * Calculate average relevance score
   * @param {Array} jobs - Array of job recommendations
   * @returns {number} Average score
   */
  calculateAverageScore(jobs) {
    if (jobs.length === 0) return 0;
    
    const total = jobs.reduce((sum, job) => sum + (job.relevanceScore || 0), 0);
    return Math.round(total / jobs.length);
  }

  /**
   * Get quick recommendation summary for API responses
   * @param {string} resumeText - Resume text
   * @param {string} desiredRole - Desired role
   * @returns {Promise<Object>} Quick summary
   */
  async getQuickSummary(resumeText, desiredRole = '') {
    try {
      const result = await this.getRecommendations(resumeText, desiredRole);
      
      return {
        success: result.success,
        role: result.analysis?.extractedRole || desiredRole,
        experience: result.analysis?.experienceLevel || 'unknown',
        jobCount: result.recommendations.count,
        averageMatch: result.recommendations.averageRelevanceScore,
        processingTime: result.processingTimeSeconds,
        topJobs: result.recommendations.jobs.slice(0, 3).map(job => ({
          title: job.title,
          company: job.company,
          location: job.location,
          relevanceScore: job.relevanceScore,
          matchReasons: job.matchReasons
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        role: desiredRole,
        experience: 'unknown',
        jobCount: 0,
        averageMatch: 0,
        processingTime: 0,
        topJobs: []
      };
    }
  }

  /**
   * Validate resume text quality
   * @param {string} resumeText - Resume text to validate
   * @returns {Object} Validation result
   */
  validateResumeText(resumeText) {
    if (!resumeText || resumeText.trim().length === 0) {
      return {
        isValid: false,
        error: 'Resume text is empty'
      };
    }

    if (resumeText.length < 100) {
      return {
        isValid: false,
        error: 'Resume text too short (minimum 100 characters required)'
      };
    }

    if (resumeText.length > 50000) {
      return {
        isValid: false,
        error: 'Resume text too long (maximum 50,000 characters allowed)'
      };
    }

    // Check for basic resume content indicators
    const resumeIndicators = [
      'experience', 'education', 'skills', 'work', 'job', 'position', 
      'responsibilities', 'achievements', 'projects', 'university', 'college'
    ];

    const textLower = resumeText.toLowerCase();
    const foundIndicators = resumeIndicators.filter(indicator => 
      textLower.includes(indicator)
    );

    if (foundIndicators.length < 2) {
      return {
        isValid: false,
        error: 'Text does not appear to be a resume (missing key resume sections)'
      };
    }

    return {
      isValid: true,
      length: resumeText.length,
      indicators: foundIndicators.length
    };
  }
}

module.exports = new JobRecommendationService();