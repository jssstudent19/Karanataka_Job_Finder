# Job Detail Scraping API Documentation

## Overview
The Job Detail Scraping API allows you to fetch full job details from external job posting sites. This is useful when the aggregated job data only contains truncated descriptions.

## Endpoint

### Scrape Full Job Details
**POST** `/api/external-jobs/:id/scrape-details`

Fetches full job details from the external URL and updates the job document in the database.

#### Parameters
- `id` (path parameter) - The MongoDB ObjectId of the external job

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully scraped full job details",
  "source": "scraped",
  "data": {
    "_id": "68ea752380e7a35e8d54a7e3",
    "title": "Senior Business Analyst - ServiceNow CSM",
    "company": "Takeda",
    "description": "Full detailed description (up to 10,000 chars)...",
    "requirements": [
      "Bachelor's degree in relevant field",
      "5+ years of experience",
      "..."
    ],
    "responsibilities": [
      "Lead project initiatives",
      "Collaborate with teams",
      "..."
    ],
    "requiredSkills": ["ServiceNow", "CSM", "Agile", "..."],
    "location": "Bangalore, Karnataka",
    "externalUrl": "https://...",
    "lastUpdated": "2025-10-11T18:17:55.651Z",
    ...
  }
}
```

##### Cached Response (200 OK)
If the job already has full details (description > 1000 chars):
```json
{
  "success": true,
  "message": "Full details already available",
  "source": "cache",
  "data": { ... }
}
```

##### No External URL (200 OK)
```json
{
  "success": false,
  "message": "No external URL available",
  "data": { ... }
}
```

##### Scraping Failed (200 OK)
```json
{
  "success": false,
  "message": "Could not scrape full details",
  "data": { ... }
}
```

##### Error Response (500)
```json
{
  "success": false,
  "message": "Failed to scrape job details",
  "error": "Error message"
}
```

## Supported Job Sites

The scraper supports multiple job platforms with specialized selectors:

1. **LinkedIn** (`linkedin.com`)
2. **Naukri** (`naukri.com`)
3. **Indeed** (`indeed.com`)
4. **Monster** (`monster.com`)
5. **Generic Scraper** (fallback for other sites)

## Features

### 1. Smart Description Extraction
- Extracts complete job descriptions (up to 10,000 characters)
- Cleans and formats text (removes excessive whitespace, normalizes newlines)
- Uses platform-specific selectors for optimal extraction

### 2. Automatic Requirements Extraction
Identifies and extracts:
- Education requirements (Bachelor's, Master's degrees)
- Experience requirements (X years of experience)
- Qualification lists from job descriptions

### 3. Automatic Responsibilities Extraction
Extracts key job responsibilities and duties from the description.

### 4. Skill Detection
Automatically detects common technical skills including:
- Programming languages (JavaScript, Python, Java, C++, etc.)
- Frameworks (React, Angular, Django, Spring, etc.)
- Databases (MongoDB, PostgreSQL, SQL)
- Cloud platforms (AWS, Azure)
- DevOps tools (Docker, Kubernetes, Jenkins)
- Methodologies (Agile, Scrum)

### 5. Caching
- If a job already has detailed description (>1000 chars), returns cached data
- Avoids unnecessary HTTP requests and respects rate limits

## Usage Examples

### Using cURL
```bash
curl -X POST http://localhost:5000/api/external-jobs/68ea752380e7a35e8d54a7e3/scrape-details
```

### Using JavaScript/Axios
```javascript
const axios = require('axios');

async function scrapeJobDetails(jobId) {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/external-jobs/${jobId}/scrape-details`
    );
    
    if (response.data.success) {
      console.log('✅ Scraping successful!');
      console.log('Description:', response.data.data.description);
      console.log('Requirements:', response.data.data.requirements);
      console.log('Skills:', response.data.data.requiredSkills);
    } else {
      console.log('⚠️ Scraping failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scrapeJobDetails('68ea752380e7a35e8d54a7e3');
```

### Using Fetch API (Frontend)
```javascript
async function scrapeJobDetails(jobId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/external-jobs/${jobId}/scrape-details`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.warn('Could not scrape details:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error scraping job details:', error);
    return null;
  }
}
```

## Implementation Notes

### Rate Limiting & Timeouts
- Request timeout: **15 seconds**
- User-Agent: Modern Chrome browser
- Max redirects: 5
- Respectful scraping with proper headers

### Error Handling
The scraper gracefully handles:
- Network timeouts
- Invalid URLs
- Anti-scraping measures
- Missing or malformed HTML
- Blocked requests

### Data Quality
- Text is cleaned and normalized
- Duplicate skills/requirements are removed
- Content is truncated to 10,000 chars to prevent database bloat
- Only updates the database if scraping is successful

## Testing

A test script is provided: `test-scrape.js`

```bash
node test-scrape.js
```

This will:
1. Fetch a job from the database
2. Attempt to scrape full details
3. Display before/after metrics
4. Show extracted requirements, responsibilities, and skills

## Integration with Frontend

### React Example Component

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function JobDetails({ job }) {
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState(job);
  const [scraped, setScraped] = useState(false);

  const loadFullDetails = async () => {
    if (scraped) return; // Already scraped
    
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/external-jobs/${job._id}/scrape-details`
      );
      
      if (response.data.success) {
        setFullDetails(response.data.data);
        setScraped(true);
      }
    } catch (error) {
      console.error('Failed to load full details:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDescriptionTruncated = job.description && job.description.length < 500;

  return (
    <div className="job-details">
      <h2>{fullDetails.title}</h2>
      <p className="company">{fullDetails.company}</p>
      
      <div className="description">
        <h3>Description</h3>
        <p>{fullDetails.description}</p>
        
        {isDescriptionTruncated && !scraped && (
          <button 
            onClick={loadFullDetails} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load Full Description'}
          </button>
        )}
      </div>

      {fullDetails.requirements && fullDetails.requirements.length > 0 && (
        <div className="requirements">
          <h3>Requirements</h3>
          <ul>
            {fullDetails.requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {fullDetails.responsibilities && fullDetails.responsibilities.length > 0 && (
        <div className="responsibilities">
          <h3>Responsibilities</h3>
          <ul>
            {fullDetails.responsibilities.map((resp, idx) => (
              <li key={idx}>{resp}</li>
            ))}
          </ul>
        </div>
      )}

      {fullDetails.requiredSkills && fullDetails.requiredSkills.length > 0 && (
        <div className="skills">
          <h3>Required Skills</h3>
          <div className="skill-tags">
            {fullDetails.requiredSkills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetails;
```

## Performance Considerations

### When to Scrape
- **On-Demand**: Only scrape when user views job details
- **Background**: Scrape popular/high-quality jobs in background
- **Batch**: Process multiple jobs during off-peak hours

### Optimization Tips
1. Check `description.length` before scraping
2. Cache scraped results (already implemented)
3. Add retry logic with exponential backoff for failed scrapes
4. Monitor scraping success rates per source
5. Respect robots.txt and terms of service

## Future Enhancements

- [ ] Add proxy support for better reliability
- [ ] Implement retry logic with exponential backoff
- [ ] Add scraping success metrics/analytics
- [ ] Support for more job platforms
- [ ] Background job queue for batch scraping
- [ ] Webhook notifications when scraping completes
- [ ] Browser automation (Puppeteer) for JavaScript-heavy sites

## Troubleshooting

### Scraping Fails Frequently
- Check if the external URL is still valid
- Verify network connectivity
- Ensure the site hasn't changed its HTML structure
- Consider implementing browser automation for JS-heavy sites

### Extracted Data is Incomplete
- The site may use JavaScript rendering (consider Puppeteer)
- HTML selectors may need updating
- Content may be behind authentication/paywall

### Performance Issues
- Implement request queuing/throttling
- Use background workers for scraping
- Cache aggressively
- Consider limiting concurrent scrape requests

## Support

For issues or questions, please check:
1. Server logs for detailed error messages
2. Network connectivity to external sites
3. Database connection status
4. The external job URL validity

## License

This feature is part of the Karnataka Job Portal backend system.
