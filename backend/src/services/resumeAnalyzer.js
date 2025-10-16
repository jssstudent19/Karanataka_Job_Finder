const axios = require('axios');
const logger = require('../config/logger');

class ResumeAnalyzerService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  /**
   * Call Google Generative AI with a prompt - returns plain text
   */
  async callGoogleGenerativeAI(prompt) {
    try {
      logger.info('Calling Gemini API...', { 
        promptLength: prompt.length,
        model: this.model,
        hasApiKey: !!this.apiKey
      });

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192, // Increased to handle thinking tokens
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      logger.info('Gemini API response received', {
        hasCandidates: !!response.data.candidates,
        candidatesLength: response.data.candidates?.length,
        fullResponse: JSON.stringify(response.data, null, 2)
      });

      if (!response.data.candidates || response.data.candidates.length === 0) {
        logger.error('No candidates returned from AI', {
          promptFeedback: response.data.promptFeedback,
          fullResponse: response.data
        });
        return 'AI returned no response. Please check API key and quota.';
      }

      const candidate = response.data.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        logger.error('No content parts in AI response', {
          candidate: candidate,
          finishReason: candidate.finishReason,
          safetyRatings: candidate.safetyRatings
        });
        return 'AI response was blocked or empty. Check content safety.';
      }

      const text = candidate.content.parts[0].text;
      logger.info('AI response extracted successfully', { textLength: text.length });
      
      return text;
    } catch (error) {
      logger.error('Google Generative AI API failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Extract all information from resume
   */
  async extractResumeData(resumeText) {
    const prompt = `Analyze this resume and extract ALL information in the following categories. Look for SKILLS section or similar sections (Technical Skills, Core Competencies, Expertise, etc.) and extract every skill mentioned.

Resume:
${resumeText}

Extract and return ONLY a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, state"
  },
  "skills": ["skill1", "skill2", "skill3", "..."],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/College Name",
      "year": "Year or Duration",
      "details": "Additional details"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "responsibilities": ["responsibility1", "responsibility2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "achievements": ["achievement1", "achievement2"]
}

IMPORTANT:
- Extract ALL skills from Skills section, Technical Skills, Core Competencies, or any similar section
- Include programming languages, frameworks, tools, soft skills, certifications
- If any section is not found, use empty array [] or empty object {}
- Return ONLY valid JSON, no other text`;

    try {
      logger.info('Extracting resume data...');
      const response = await this.callGoogleGenerativeAI(prompt);
      
      if (!response || response.includes('AI returned no response')) {
        throw new Error('AI did not return a response');
      }

      // Extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const data = JSON.parse(jsonMatch[0]);
      logger.info('Resume data extracted successfully', {
        skillsCount: data.skills?.length || 0,
        experienceCount: data.experience?.length || 0,
        projectsCount: data.projects?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Resume data extraction failed:', error);
      throw new Error(`Failed to extract resume data: ${error.message}`);
    }
  }

  /**
   * Analyze resume and extract all information
   */
  async analyzeResume(resumeText) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      logger.info('Starting resume analysis...');

      const resumeData = await this.extractResumeData(resumeText);

      logger.info('Resume analysis completed');
      return resumeData;

    } catch (error) {
      logger.error('Resume analysis failed:', error);
      throw new Error(`Resume analysis failed: ${error.message}`);
    }
  }
}

module.exports = new ResumeAnalyzerService();
