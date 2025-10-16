/**
 * Gemini Resume Parser Service
 * Extracts job role and experience level from resume content using Google's Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiResumeParser {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not configured in .env');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Parse resume content to extract job preferences
   * @param {string} resumeText - Raw text content of resume
   * @param {string} desiredRole - User-specified desired role
   * @returns {Promise<Object>} Parsed job preferences
   */
  async parseResume(resumeText, desiredRole = '') {
    if (!this.genAI) {
      // Fallback parsing without AI
      return this.fallbackParse(resumeText, desiredRole);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Analyze the following resume and extract job search preferences in JSON format:

RESUME CONTENT:
${resumeText}

DESIRED ROLE (if specified): ${desiredRole}

Please extract and return ONLY a JSON object with these fields:
{
  "role": "specific job title/role the person is looking for",
  "experience": "entry|junior|mid|senior|lead|executive",
  "skills": ["skill1", "skill2", "skill3"],
  "industry": "primary industry/domain",
  "experienceYears": number,
  "location": "preferred location if mentioned"
}

Rules:
- If DESIRED ROLE is provided, use that as the "role" 
- For experience level: entry (0-2 years), junior (2-4 years), mid (4-7 years), senior (7-10 years), lead (10-15 years), executive (15+ years)
- Extract top 5 technical skills
- Keep role specific and searchable (e.g., "Software Engineer", "Data Scientist", "Marketing Manager")
- Return only valid JSON, no additional text
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 Gemini Raw Response:', text);

      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        const validated = {
          role: parsed.role || desiredRole || 'Software Engineer',
          experience: this.validateExperience(parsed.experience),
          skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 5) : [],
          industry: parsed.industry || 'Technology',
          experienceYears: parseInt(parsed.experienceYears) || 2,
          location: parsed.location || 'Karnataka'
        };

        console.log('✅ Parsed Resume Data:', validated);
        return validated;
      }

      throw new Error('No valid JSON found in Gemini response');

    } catch (error) {
      console.error('❌ Gemini parsing failed:', error.message);
      console.log('🔄 Falling back to basic parsing...');
      
      return this.fallbackParse(resumeText, desiredRole);
    }
  }

  /**
   * Fallback parsing without AI
   * @param {string} resumeText - Resume content
   * @param {string} desiredRole - Desired role
   * @returns {Object} Basic parsed data
   */
  fallbackParse(resumeText, desiredRole) {
    const text = resumeText.toLowerCase();
    
    // Extract experience years
    const experienceMatch = text.match(/(\d+)[\s]*(?:years?|yrs?)[\s]*(?:of\s*)?(?:experience|exp)/);
    const experienceYears = experienceMatch ? parseInt(experienceMatch[1]) : 2;

    // Map experience years to levels
    let experience = 'mid';
    if (experienceYears <= 2) experience = 'entry';
    else if (experienceYears <= 4) experience = 'junior';
    else if (experienceYears <= 7) experience = 'mid';
    else if (experienceYears <= 10) experience = 'senior';
    else if (experienceYears <= 15) experience = 'lead';
    else experience = 'executive';

    // Extract common skills
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb',
      'html', 'css', 'aws', 'docker', 'kubernetes', 'git', 'machine learning',
      'data analysis', 'project management', 'agile', 'scrum'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      text.includes(skill.toLowerCase())
    ).slice(0, 5);

    // Determine industry
    let industry = 'Technology';
    if (text.includes('marketing')) industry = 'Marketing';
    else if (text.includes('finance') || text.includes('accounting')) industry = 'Finance';
    else if (text.includes('healthcare') || text.includes('medical')) industry = 'Healthcare';
    else if (text.includes('education')) industry = 'Education';

    const result = {
      role: desiredRole || 'Software Engineer',
      experience,
      skills: foundSkills,
      industry,
      experienceYears,
      location: 'Karnataka'
    };

    console.log('🔄 Fallback Parse Result:', result);
    return result;
  }

  /**
   * Validate experience level against allowed values
   */
  validateExperience(exp) {
    const validLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    return validLevels.includes(exp) ? exp : 'mid';
  }

  /**
   * Generate job search keywords from parsed data
   * @param {Object} parsedData - Data from parseResume
   * @returns {Array} Search keywords
   */
  generateSearchKeywords(parsedData) {
    const keywords = [
      parsedData.role,
      ...parsedData.skills.slice(0, 3), // Top 3 skills
      parsedData.industry
    ];

    return keywords.filter(k => k && k.length > 2);
  }
}

module.exports = new GeminiResumeParser();