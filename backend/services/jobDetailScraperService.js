const axios = require('axios');
const cheerio = require('cheerio');
const ExternalJob = require('../src/models/ExternalJob');

class JobDetailScraperService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.timeout = 15000; // 15 seconds
  }

  // Main method to fetch additional job details (requirements, responsibilities, skills)
  async fetchFullJobDetails(jobId) {
    try {
      const job = await ExternalJob.findById(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // If we already have detailed requirements, return it
      if (job.requirements && job.requirements.length > 3 && !job.requirements.includes('See job description')) {
        console.log('✅ Already have detailed requirements');
        return {
          success: true,
          source: 'cache',
          data: job
        };
      }

      // If no external URL, can't scrape
      if (!job.externalUrl) {
        return {
          success: false,
          message: 'No external URL available',
          data: job
        };
      }

      console.log(`🔍 Scraping full details from: ${job.externalUrl}`);

      // Try to scrape based on the URL pattern
      let scrapedData = null;

      if (job.externalUrl.includes('linkedin.com')) {
        scrapedData = await this.scrapeLinkedIn(job.externalUrl);
      } else if (job.externalUrl.includes('naukri.com')) {
        scrapedData = await this.scrapeNaukri(job.externalUrl);
      } else if (job.externalUrl.includes('indeed.com')) {
        scrapedData = await this.scrapeIndeed(job.externalUrl);
      } else if (job.externalUrl.includes('monster.com')) {
        scrapedData = await this.scrapeMonster(job.externalUrl);
      } else {
        // Generic scraper for other sites
        scrapedData = await this.scrapeGeneric(job.externalUrl);
      }

      if (scrapedData) {
        // Update the job with additional details (NOT description - users should visit original site)
        if (scrapedData.requirements && scrapedData.requirements.length > 0) {
          job.requirements = scrapedData.requirements;
        }
        if (scrapedData.responsibilities && scrapedData.responsibilities.length > 0) {
          job.responsibilities = scrapedData.responsibilities;
        }
        if (scrapedData.skills && scrapedData.skills.length > 0) {
          job.requiredSkills = [...new Set([...job.requiredSkills, ...scrapedData.skills])];
        }
        
        job.lastUpdated = new Date();
        await job.save();

        console.log('✅ Successfully scraped and saved additional details');

        return {
          success: true,
          source: 'scraped',
          data: job
        };
      } else {
        return {
          success: false,
          message: 'Could not scrape additional details',
          data: job
        };
      }
    } catch (error) {
      console.error('❌ Error fetching full job details:', error.message);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  // LinkedIn scraper
  async scrapeLinkedIn(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      // LinkedIn job description selectors - get HTML content
      const descriptionHtml = $('.description__text').html() ||
                              $('.show-more-less-html__markup').html() ||
                              $('[class*="description"]').html() || '';

      return {
        requirements: this.extractRequirementsHtml(descriptionHtml, $),
        responsibilities: this.extractResponsibilitiesHtml(descriptionHtml, $),
        skills: this.extractSkills(this.cleanText(descriptionHtml))
      };
    } catch (error) {
      console.error('LinkedIn scrape error:', error.message);
      return null;
    }
  }

  // Naukri.com scraper
  async scrapeNaukri(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      const descriptionHtml = $('.job-desc').html() ||
                              $('.JDC_description').html() ||
                              $('[class*="description"]').html() || '';

      return {
        requirements: this.extractRequirementsHtml(descriptionHtml, $),
        responsibilities: this.extractResponsibilitiesHtml(descriptionHtml, $),
        skills: this.extractSkills(this.cleanText(descriptionHtml))
      };
    } catch (error) {
      console.error('Naukri scrape error:', error.message);
      return null;
    }
  }

  // Indeed scraper
  async scrapeIndeed(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      const descriptionHtml = $('#jobDescriptionText').html() ||
                              $('.jobsearch-jobDescriptionText').html() ||
                              $('[id*="jobDescription"]').html() || '';

      return {
        requirements: this.extractRequirementsHtml(descriptionHtml, $),
        responsibilities: this.extractResponsibilitiesHtml(descriptionHtml, $),
        skills: this.extractSkills(this.cleanText(descriptionHtml))
      };
    } catch (error) {
      console.error('Indeed scrape error:', error.message);
      return null;
    }
  }

  // Monster scraper
  async scrapeMonster(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      const descriptionHtml = $('.job-description').html() ||
                              $('[class*="description"]').html() || '';

      return {
        requirements: this.extractRequirementsHtml(descriptionHtml, $),
        responsibilities: this.extractResponsibilitiesHtml(descriptionHtml, $),
        skills: this.extractSkills(this.cleanText(descriptionHtml))
      };
    } catch (error) {
      console.error('Monster scrape error:', error.message);
      return null;
    }
  }

  // Generic scraper for unknown sites
  async scrapeGeneric(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: this.timeout,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple common selectors for job descriptions
      const possibleSelectors = [
        '.job-description',
        '.description',
        '#job-description',
        '#description',
        '[class*="job-desc"]',
        '[class*="description"]',
        '[id*="description"]',
        'article',
        '.content',
        'main'
      ];

      let descriptionHtml = '';
      for (const selector of possibleSelectors) {
        const html = $(selector).html() || '';
        if (html.length > descriptionHtml.length) {
          descriptionHtml = html;
        }
      }

      if (descriptionHtml && descriptionHtml.length > 200) {
        return {
          requirements: this.extractRequirementsHtml(descriptionHtml, $),
          responsibilities: this.extractResponsibilitiesHtml(descriptionHtml, $),
          skills: this.extractSkills(this.cleanText(descriptionHtml))
        };
      }

      return null;
    } catch (error) {
      console.error('Generic scrape error:', error.message);
      return null;
    }
  }

  // Helper: Clean extracted text while preserving formatting
  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove script and style tags completely
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      // Convert structural HTML to newlines and formatting
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<br[^>]*\/?>/gi, '\n')
      .replace(/<br>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      // Convert list items to bullet points
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/?ul[^>]*>/gi, '\n')
      .replace(/<\/?ol[^>]*>/gi, '\n')
      // Convert strong/bold to text (keep the text, remove tags)
      .replace(/<\/?strong[^>]*>/gi, '')
      .replace(/<\/?b[^>]*>/gi, '')
      .replace(/<\/?em[^>]*>/gi, '')
      .replace(/<\/?i[^>]*>/gi, '')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&bull;/g, '•')
      .replace(/&hellip;/g, '...')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      // Clean up whitespace while preserving intentional breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/ +/g, ' ')  // Multiple spaces to single space
      .replace(/\n +/g, '\n')  // Remove leading spaces on lines
      .replace(/ +\n/g, '\n')  // Remove trailing spaces on lines
      .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      .trim()
      .substring(0, 10000);  // Limit to 10k chars
  }

  // Helper: Extract requirements as HTML (preserving formatting)
  extractRequirementsHtml(html, $) {
    if (!html) return [];
    
    try {
      const tempDiv = cheerio.load(`<div>${html}</div>`);
      const requirements = [];
      
      // Look for requirements section with various headers
      const reqHeaders = ['requirements', 'qualifications', 'required qualifications', 'must have', 'what you need'];
      
      tempDiv('h1, h2, h3, h4, h5, h6, strong, b').each((i, elem) => {
        const headerText = tempDiv(elem).text().toLowerCase().trim();
        
        if (reqHeaders.some(header => headerText.includes(header))) {
          // Found requirements header, get next sibling elements until next header
          let current = tempDiv(elem).next();
          
          while (current.length && !current.is('h1, h2, h3, h4, h5, h6')) {
            if (current.is('ul, ol')) {
              // Extract list items with HTML
              current.find('li').each((idx, li) => {
                const itemHtml = tempDiv(li).html();
                if (itemHtml && itemHtml.trim().length > 10) {
                  requirements.push(itemHtml.trim());
                }
              });
            } else if (current.is('p') || current.is('div')) {
              const itemHtml = current.html();
              if (itemHtml && itemHtml.trim().length > 10) {
                requirements.push(itemHtml.trim());
              }
            }
            current = current.next();
          }
        }
      });
      
      return requirements.slice(0, 15);
    } catch (error) {
      console.error('Error extracting requirements HTML:', error.message);
      // Fallback to text extraction
      return this.extractRequirements(this.cleanText(html));
    }
  }

  // Helper: Extract responsibilities as HTML (preserving formatting)
  extractResponsibilitiesHtml(html, $) {
    if (!html) return [];
    
    try {
      const tempDiv = cheerio.load(`<div>${html}</div>`);
      const responsibilities = [];
      
      // Look for responsibilities section with various headers
      const respHeaders = ['responsibilities', 'duties', 'you will', 'what you\'ll do', 'key responsibilities', 'role responsibilities'];
      
      tempDiv('h1, h2, h3, h4, h5, h6, strong, b').each((i, elem) => {
        const headerText = tempDiv(elem).text().toLowerCase().trim();
        
        if (respHeaders.some(header => headerText.includes(header))) {
          // Found responsibilities header, get next sibling elements
          let current = tempDiv(elem).next();
          
          while (current.length && !current.is('h1, h2, h3, h4, h5, h6')) {
            if (current.is('ul, ol')) {
              // Extract list items with HTML
              current.find('li').each((idx, li) => {
                const itemHtml = tempDiv(li).html();
                if (itemHtml && itemHtml.trim().length > 10) {
                  responsibilities.push(itemHtml.trim());
                }
              });
            } else if (current.is('p') || current.is('div')) {
              const itemHtml = current.html();
              if (itemHtml && itemHtml.trim().length > 10) {
                responsibilities.push(itemHtml.trim());
              }
            }
            current = current.next();
          }
        }
      });
      
      return responsibilities.slice(0, 15);
    } catch (error) {
      console.error('Error extracting responsibilities HTML:', error.message);
      // Fallback to text extraction
      return this.extractResponsibilities(this.cleanText(html));
    }
  }

  // Helper: Extract requirements from text
  extractRequirements(text) {
    const requirements = [];
    const lowerText = text.toLowerCase();

    // Look for requirements section
    const reqMatch = text.match(/(?:requirements?|qualifications?|must have):?(.*?)(?:responsibilities?|about|$)/is);
    if (reqMatch && reqMatch[1]) {
      const reqText = reqMatch[1];
      const lines = reqText.split(/\n|•|·|-/).filter(line => line.trim().length > 10);
      requirements.push(...lines.slice(0, 10).map(line => line.trim()));
    }

    // Extract education requirements
    if (lowerText.includes('bachelor') || lowerText.includes('degree')) {
      const eduMatch = text.match(/(bachelor'?s?|master'?s?|degree)[^.!?]*[.!?]/i);
      if (eduMatch) requirements.push(eduMatch[0].trim());
    }

    // Extract experience requirements
    if (lowerText.includes('year') && lowerText.includes('experience')) {
      const expMatch = text.match(/(\d+\+?)\s*(?:to|-)\s*(\d+)?\s*years?\s+(?:of\s+)?experience/i);
      if (expMatch) requirements.push(expMatch[0].trim());
    }

    return [...new Set(requirements)].slice(0, 15);
  }

  // Helper: Extract responsibilities from text
  extractResponsibilities(text) {
    const responsibilities = [];

    const respMatch = text.match(/(?:responsibilities?|duties|you will):?(.*?)(?:requirements?|qualifications?|$)/is);
    if (respMatch && respMatch[1]) {
      const respText = respMatch[1];
      const lines = respText.split(/\n|•|·|-/).filter(line => line.trim().length > 10);
      responsibilities.push(...lines.slice(0, 10).map(line => line.trim()));
    }

    return [...new Set(responsibilities)].slice(0, 15);
  }

  // Helper: Extract skills from text
  extractSkills(text) {
    const skills = [];
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
      'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
      'Git', 'HTML', 'CSS', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby',
      'Django', 'Flask', 'Spring', 'Express', 'GraphQL', 'REST API',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD',
      'Agile', 'Scrum', 'Jenkins', 'Linux', 'Microservices'
    ];

    const lowerText = text.toLowerCase();
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return [...new Set(skills)];
  }
}

module.exports = new JobDetailScraperService();
