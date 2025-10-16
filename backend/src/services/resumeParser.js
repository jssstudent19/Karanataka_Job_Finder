const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const logger = require('../config/logger');

class ResumeParserService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  /**
   * Extract text content from various file formats
   */
  async extractTextFromFile(fileBuffer, mimetype, filename) {
    try {
      let extractedText = '';

      switch (mimetype) {
        case 'application/pdf':
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
          const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = docxData.value;
          break;

        case 'application/msword': // .doc
          // For .doc files, we'll try to use mammoth as well
          try {
            const docData = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = docData.value;
          } catch (docError) {
            logger.warn(`Failed to parse .doc file ${filename}:`, docError);
            throw new Error('Unable to process .doc file. Please convert to .docx or PDF format.');
          }
          break;

        case 'text/plain': // .txt
          extractedText = fileBuffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the file');
      }

      return extractedText;
    } catch (error) {
      logger.error(`Text extraction failed for ${filename}:`, error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  /**
   * Parse resume using Gemini AI to extract structured data
   */
  async parseResumeWithAI(extractedText) {
    try {
      if (!this.apiKey) {
        logger.warn('Gemini API key not configured, using basic parser');
        throw new Error('Gemini API key not configured');
      }

      logger.info(`Parsing resume with Gemini AI (${extractedText.length} characters extracted)`);
      
      const prompt = this.createParsingPrompt(extractedText);
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,  // Increased for better parsing
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000  // 30 second timeout
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      logger.info('Gemini AI response received');
      logger.debug('AI Response:', aiResponse.substring(0, 500));
      
      // Extract JSON from response (Gemini might include markdown formatting)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No valid JSON found in AI response');
        throw new Error('No valid JSON found in AI response');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      logger.info('Successfully parsed JSON from AI response');

      // Post-process and validate the parsed data
      const cleanedData = this.validateAndCleanParsedData(parsedData);
      
      logger.info('Resume parsing completed', {
        name: cleanedData.name,
        skillsCount: cleanedData.skills?.length || 0,
        experienceCount: cleanedData.experience?.length || 0,
        educationCount: cleanedData.education?.length || 0
      });
      
      return cleanedData;

    } catch (error) {
      logger.error('Gemini AI parsing failed:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Fallback to basic parsing if AI fails
      logger.info('Falling back to basic parsing...');
      return this.basicResumeParser(extractedText);
    }
  }

  /**
   * Create a comprehensive prompt for Gemini AI parsing
   */
  createParsingPrompt(resumeText) {
    return `You are a professional resume parser. Analyze the following resume and extract information in this EXACT JSON structure. Return ONLY the JSON object, no additional text:

{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": {
    "address": "Full address if available",
    "city": "City name",
    "state": "State/Province",
    "country": "Country",
    "postalCode": "Postal/ZIP code"
  },
  "summary": "Professional summary or objective",
  "skills": ["Array of technical and professional skills"],
  "experience": [
    {
      "jobTitle": "Job title",
      "company": "Company name",
      "location": "Job location",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "current": false,
      "description": "Job description",
      "responsibilities": ["Array of key responsibilities"],
      "achievements": ["Array of notable achievements"]
    }
  ],
  "education": [
    {
      "degree": "Degree title",
      "institution": "Institution name",
      "fieldOfStudy": "Field of study",
      "startYear": 2020,
      "endYear": 2024,
      "grade": "GPA/Grade if mentioned",
      "ongoing": false
    }
  ],
  "projects": [
    {
      "title": "Project name",
      "description": "Project description",
      "technologies": ["Array of technologies used"],
      "startDate": "Start date",
      "endDate": "End date",
      "url": "Project URL if available"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "issueDate": "Issue date",
      "expiryDate": "Expiry date if applicable",
      "credentialId": "Credential ID if available"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "basic|intermediate|advanced|native|fluent"
    }
  ],
  "totalExperienceYears": 5,
  "currentRole": "Current job title",
  "currentCompany": "Current company name",
  "linkedin": "LinkedIn profile URL",
  "github": "GitHub profile URL",
  "portfolio": "Portfolio website URL"
}

Resume Text:
${resumeText}

Please extract as much information as possible and return ONLY the JSON object. If information is not available, use null or empty arrays as appropriate.`;
  }

  /**
   * Validate and clean the AI-parsed data
   */
  validateAndCleanParsedData(parsedData) {
    const cleanedData = {
      name: this.cleanString(parsedData.name),
      email: this.cleanEmail(parsedData.email),
      phone: this.cleanString(parsedData.phone),
      location: this.cleanLocation(parsedData.location),
      summary: this.cleanString(parsedData.summary),
      skills: this.cleanSkillsArray(parsedData.skills),
      experience: this.cleanExperienceArray(parsedData.experience),
      education: this.cleanEducationArray(parsedData.education),
      projects: this.cleanProjectsArray(parsedData.projects),
      certifications: this.cleanCertificationsArray(parsedData.certifications),
      languages: this.cleanLanguagesArray(parsedData.languages),
      totalExperienceYears: this.calculateExperience(parsedData.totalExperienceYears, parsedData.experience),
      currentRole: this.cleanString(parsedData.currentRole),
      currentCompany: this.cleanString(parsedData.currentCompany),
      linkedin: this.cleanUrl(parsedData.linkedin, 'linkedin'),
      github: this.cleanUrl(parsedData.github, 'github'),
      portfolio: this.cleanUrl(parsedData.portfolio),
      parsingModel: this.model,
      parsingConfidence: 0.8 // AI parsing typically has good confidence
    };

    return cleanedData;
  }

  /**
   * Basic fallback parser if AI parsing fails
   */
  basicResumeParser(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      name: this.extractBasicName(lines),
      email: this.extractBasicEmail(text),
      phone: this.extractBasicPhone(text),
      skills: this.extractBasicSkills(text),
      extractedText: text,
      parsingModel: 'basic_parser',
      parsingConfidence: 0.3,
      parsingErrors: [
        {
          field: 'general',
          error: 'AI parsing failed, using basic extraction',
          severity: 'medium'
        }
      ]
    };
  }

  /**
   * Helper methods for data cleaning and validation
   */
  cleanString(str) {
    return (str && typeof str === 'string') ? str.trim() : null;
  }

  cleanEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = email.trim().toLowerCase();
    return emailRegex.test(cleaned) ? cleaned : null;
  }

  cleanLocation(location) {
    if (!location || typeof location !== 'object') return {};
    
    return {
      address: this.cleanString(location.address),
      city: this.cleanString(location.city),
      state: this.cleanString(location.state),
      country: this.cleanString(location.country),
      postalCode: this.cleanString(location.postalCode)
    };
  }

  cleanSkillsArray(skills) {
    if (!Array.isArray(skills)) return [];
    
    return skills
      .filter(skill => skill && typeof skill === 'string')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .slice(0, 50); // Limit to 50 skills
  }

  cleanExperienceArray(experience) {
    if (!Array.isArray(experience)) return [];
    
    return experience.map(exp => ({
      jobTitle: this.cleanString(exp.jobTitle),
      company: this.cleanString(exp.company),
      location: this.cleanString(exp.location),
      startDate: this.cleanString(exp.startDate),
      endDate: this.cleanString(exp.endDate),
      current: Boolean(exp.current),
      description: this.cleanString(exp.description),
      responsibilities: Array.isArray(exp.responsibilities) 
        ? exp.responsibilities.filter(r => r && typeof r === 'string').map(r => r.trim())
        : [],
      achievements: Array.isArray(exp.achievements)
        ? exp.achievements.filter(a => a && typeof a === 'string').map(a => a.trim())
        : []
    })).filter(exp => exp.jobTitle || exp.company);
  }

  cleanEducationArray(education) {
    if (!Array.isArray(education)) return [];
    
    return education.map(edu => ({
      degree: this.cleanString(edu.degree),
      institution: this.cleanString(edu.institution),
      fieldOfStudy: this.cleanString(edu.fieldOfStudy),
      startYear: Number.isInteger(edu.startYear) ? edu.startYear : null,
      endYear: Number.isInteger(edu.endYear) ? edu.endYear : null,
      grade: this.cleanString(edu.grade),
      ongoing: Boolean(edu.ongoing)
    })).filter(edu => edu.degree || edu.institution);
  }

  cleanProjectsArray(projects) {
    if (!Array.isArray(projects)) return [];
    
    return projects.map(proj => ({
      title: this.cleanString(proj.title),
      description: this.cleanString(proj.description),
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.filter(t => t && typeof t === 'string').map(t => t.trim())
        : [],
      startDate: this.cleanString(proj.startDate),
      endDate: this.cleanString(proj.endDate),
      url: this.cleanUrl(proj.url),
      github: this.cleanUrl(proj.github, 'github')
    })).filter(proj => proj.title);
  }

  cleanCertificationsArray(certifications) {
    if (!Array.isArray(certifications)) return [];
    
    return certifications.map(cert => ({
      name: this.cleanString(cert.name),
      issuer: this.cleanString(cert.issuer),
      issueDate: this.cleanString(cert.issueDate),
      expiryDate: this.cleanString(cert.expiryDate),
      credentialId: this.cleanString(cert.credentialId),
      url: this.cleanUrl(cert.url)
    })).filter(cert => cert.name);
  }

  cleanLanguagesArray(languages) {
    if (!Array.isArray(languages)) return [];
    
    const validProficiencies = ['basic', 'intermediate', 'advanced', 'native', 'fluent'];
    
    return languages.map(lang => ({
      language: this.cleanString(lang.language),
      proficiency: validProficiencies.includes(lang.proficiency) ? lang.proficiency : 'intermediate'
    })).filter(lang => lang.language);
  }

  cleanUrl(url, type = null) {
    if (!url || typeof url !== 'string') return null;
    
    const cleaned = url.trim();
    
    // Basic URL validation
    try {
      new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
      
      // Type-specific validation
      if (type === 'linkedin' && !cleaned.includes('linkedin.com')) return null;
      if (type === 'github' && !cleaned.includes('github.com')) return null;
      
      return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
    } catch {
      return null;
    }
  }

  calculateExperience(aiCalculated, experience) {
    if (Number.isInteger(aiCalculated) && aiCalculated >= 0) {
      return aiCalculated;
    }
    
    // Calculate from experience array if AI calculation failed
    if (!Array.isArray(experience)) return 0;
    
    // This is a simplified calculation
    return Math.max(0, experience.length * 1.5); // Rough estimate
  }

  /**
   * Basic extraction methods for fallback parser
   */
  extractBasicName(lines) {
    // Usually the name is in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line && !line.includes('@') && !line.match(/^\d+/) && line.length < 50) {
        // Skip lines that look like contact info
        if (!line.includes('phone') && !line.includes('email') && !line.includes('address')) {
          return line;
        }
      }
    }
    return null;
  }

  extractBasicEmail(text) {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0].toLowerCase() : null;
  }

  extractBasicPhone(text) {
    const phoneRegex = /[\+]?[1-9]?[\-\.\s]?\(?\d{1,4}\)?[\-\.\s]?\d{1,4}[\-\.\s]?\d{1,9}/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : null;
  }

  extractBasicSkills(text) {
    // Common skill keywords
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
      'angular', 'vue', 'mongodb', 'mysql', 'aws', 'docker', 'kubernetes',
      'git', 'agile', 'scrum', 'management', 'leadership', 'communication'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill)) {
        foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return [...new Set(foundSkills)]; // Remove duplicates
  }
}

// Create and export a singleton instance
const resumeParser = new ResumeParserService();
module.exports = resumeParser;