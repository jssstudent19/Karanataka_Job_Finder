# LinkedIn Jobs API Integration Guide

## 📋 Overview

The Karnataka Job Portal now integrates with **LinkedIn Job Search API** via RapidAPI to fetch the freshest job postings from LinkedIn (posted within the last hour).

### ✨ Key Benefits

- 🔥 **Freshest Jobs**: Get jobs posted within the last hour
- 🏢 **Rich Metadata**: Company size, industry, specialties, follower count
- 📍 **Precise Location**: Exact GPS coordinates for job locations
- 💰 **Salary Data**: When available from LinkedIn
- 👤 **Recruiter Info**: Contact details for recruiters (when available)
- 🎯 **Karnataka Focused**: Pre-filtered for Karnataka locations

---

## 🔑 API Setup

### Prerequisites

1. **RapidAPI Account**: Sign up at [https://rapidapi.com](https://rapidapi.com)
2. **API Subscription**: Subscribe to "LinkedIn Job Search API" on RapidAPI
   - URL: `https://rapidapi.com/rockapis-rockapis-default/api/linkedin-job-search-api/`
   - Free Tier Available
3. **API Key**: Copy your RapidAPI key from the dashboard

### Environment Variables

Already configured in `.env`:

```env
# LinkedIn Jobs API (RapidAPI) - Active Jobs
LINKEDIN_RAPIDAPI_KEY=
LINKEDIN_RAPIDAPI_HOST=linkedin-job-search-api.p.rapidapi.com
```

---

## 🚀 Usage

### 1. Direct Service Usage

```javascript
const linkedInJobsService = require('./services/linkedInJobsService');

// Fetch active jobs
const jobs = await linkedInJobsService.fetchActiveJobs({
  locationFilter: 'Karnataka OR Bangalore OR Bengaluru',
  titleFilter: 'Software Engineer', // Optional
  typeFilter: 'FULL_TIME,PART_TIME,CONTRACTOR',
  remote: '', // '', 'true', or 'false'
  limit: 50
});

// Fetch and save to database
const result = await linkedInJobsService.fetchAndSaveJobs({
  locationFilter: 'Karnataka OR Bangalore',
  limit: 100
});

console.log(result);
// {
//   fetched: 50,
//   saved: 45,
//   duplicates: 5,
//   errors: 0
// }
```

### 2. Via Job Aggregator

```javascript
const jobAggregatorService = require('./services/jobAggregatorService');

// LinkedIn is now a default source
const result = await jobAggregatorService.fetchAndSaveAllJobs({
  location: 'Karnataka,India',
  limitPerSource: 200,
  sources: ['linkedin', 'jsearch', 'adzuna', 'careerjet']
});
```

### 3. API Endpoint (Admin Only)

```bash
POST /api/external-jobs/admin/scrape
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "location": "Karnataka,India",
  "limitPerSource": 200,
  "sources": ["linkedin", "jsearch", "adzuna"]
}
```

---

## 📊 Data Structure

### Raw LinkedIn API Response

```json
{
  "id": "1085628554",
  "date_posted": "2024-11-17T13:38:44",
  "title": "Software Engineer",
  "organization": "Tech Company",
  "url": "https://www.linkedin.com/jobs/view/...",
  "locations_derived": ["Bangalore, Karnataka, India"],
  "cities_derived": ["Bangalore"],
  "regions_derived": ["Karnataka"],
  "countries_derived": ["India"],
  "lats_derived": [12.9716],
  "lngs_derived": [77.5946],
  "salary_raw": {
    "currency": "INR",
    "value": {
      "minValue": 800000,
      "maxValue": 1200000,
      "unitText": "YEAR"
    }
  },
  "employment_type": ["FULL_TIME"],
  "remote_derived": false,
  "linkedin_org_employees": 500,
  "linkedin_org_industry": "Information Technology",
  "linkedin_org_size": "501-1,000 employees",
  "linkedin_org_followers": 12500
}
```

### Normalized to ExternalJob Schema

```json
{
  "source": "linkedin-rapidapi",
  "externalId": "linkedin-1085628554",
  "title": "Software Engineer",
  "company": "Tech Company",
  "location": "Bangalore, Karnataka, India",
  "description": "...",
  "externalUrl": "https://www.linkedin.com/jobs/view/...",
  "postedDate": "2024-11-17T13:38:44.000Z",
  "jobType": "Full-time",
  "workMode": "On-site",
  "salary": {
    "min": 800000,
    "max": 1200000,
    "currency": "INR",
    "period": "year"
  },
  "linkedin": {
    "orgEmployees": 500,
    "orgIndustry": "Information Technology",
    "orgSize": "501-1,000 employees",
    "orgFollowers": 12500,
    "orgUrl": "https://www.linkedin.com/company/...",
    "orgSpecialties": ["Software Development", "Cloud Computing"],
    "recruiterName": "John Doe",
    "recruiterUrl": "https://www.linkedin.com/in/..."
  },
  "parsedLocation": {
    "city": "Bangalore",
    "region": "Karnataka",
    "country": "India",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  }
}
```

---

## ⚙️ Configuration Options

### Location Filters

```javascript
// Single location
locationFilter: 'Karnataka'

// Multiple locations (OR)
locationFilter: 'Karnataka OR Bangalore OR Bengaluru'

// Multiple cities
locationFilter: 'Bangalore OR Mysore OR Mangalore'
```

### Job Type Filters

```javascript
// Single type
typeFilter: 'FULL_TIME'

// Multiple types
typeFilter: 'FULL_TIME,PART_TIME,CONTRACTOR,INTERN'

// Available types:
// - FULL_TIME
// - PART_TIME
// - CONTRACTOR
// - INTERN
// - TEMPORARY
// - VOLUNTEER
// - OTHER
```

### Remote Work Filter

```javascript
// All jobs (default)
remote: ''

// Only remote jobs
remote: 'true'

// Only on-site jobs
remote: 'false'
```

### Title Filters

```javascript
// Simple search
titleFilter: 'Software Engineer'

// Multiple keywords (OR)
titleFilter: 'Developer OR Engineer OR Programmer'

// Advanced (AND, NOT)
// Note: Requires advanced_title_filter parameter (see API docs)
```

---

## 📈 Rate Limits

### RapidAPI Limits

- **Free Tier**: Check your specific plan on RapidAPI
- **Recommended**: Add 2-second delays between requests
- **Best Practice**: Run aggregation once per hour for fresh jobs

### Implementation

The service automatically includes rate limiting:

```javascript
// In jobAggregatorService.js
await this.delay(2000); // 2-second delay between sources
```

---

## 🧪 Testing

### Run Test Script

```bash
# Backend directory
node test-linkedin.js
```

### Expected Output

```
🧪 Testing LinkedIn Jobs API Integration
======================================================================

📋 Test 1: Fetching active LinkedIn jobs...
🔍 Fetching LinkedIn Jobs (location: Karnataka OR Bangalore OR Bengaluru)...
✅ LinkedIn: Fetched 50 active jobs

📊 Sample Jobs:

[1] Senior Software Engineer
    Company: Tech Corp
    Location: Bangalore, Karnataka, India
    Posted: 2024-11-17T13:38:44
    Type: FULL_TIME
    Remote: false
    Company Size: 1000 employees
    Industry: Information Technology

...

✅ LinkedIn Integration Test Completed Successfully!
```

---

## 🔧 Troubleshooting

### Issue: "You are not subscribed to this API"

**Solution**: 
1. Visit [RapidAPI LinkedIn Job Search API](https://rapidapi.com/rockapis-rockapis-default/api/linkedin-job-search-api/)
2. Click "Subscribe to Test"
3. Choose a pricing plan (Free tier available)
4. Copy your API key and update `.env`

### Issue: No jobs returned

**Possible Reasons**:
- No new jobs posted in Karnataka in the last hour (expected!)
- API rate limit reached
- Invalid location filter
- API subscription expired

**Solution**: Wait an hour and try again, or check API dashboard

### Issue: 403 Forbidden

**Solution**: Verify API key is correct and subscription is active

### Issue: Duplicate jobs

This is normal! The service automatically handles duplicates:

```javascript
// Check if job already exists
const existing = await ExternalJob.findOne({
  externalId: normalizedJob.externalId
});

if (existing) {
  duplicates++;
  continue; // Skip
}
```

---

## 🎯 Best Practices

### 1. Scheduling

```javascript
// Run hourly for fresh jobs
cron.schedule('0 * * * *', async () => {
  await jobAggregatorService.fetchAndSaveAllJobs({
    sources: ['linkedin'],
    limitPerSource: 50
  });
});
```

### 2. Error Handling

```javascript
try {
  const jobs = await linkedInJobsService.fetchActiveJobs();
} catch (error) {
  if (error.response?.status === 403) {
    console.error('API subscription issue');
  } else if (error.response?.status === 429) {
    console.error('Rate limit reached');
  }
}
```

### 3. Data Quality

LinkedIn data is typically high-quality because:
- Direct from LinkedIn
- Company-verified information
- Real-time updates
- Structured metadata

---

## 📊 Frontend Integration

### Display LinkedIn Badge

```jsx
{job.source === 'linkedin-rapidapi' && (
  <span className="badge linkedin-badge">
    <LinkedInIcon /> LinkedIn
  </span>
)}
```

### Show Rich Metadata

```jsx
{job.linkedin && (
  <div className="company-info">
    <p>🏢 {job.linkedin.orgSize}</p>
    <p>🏭 {job.linkedin.orgIndustry}</p>
    <p>👥 {job.linkedin.orgEmployees} employees</p>
    <p>👍 {job.linkedin.orgFollowers} followers</p>
  </div>
)}
```

### Display Location Map

```jsx
{job.parsedLocation?.coordinates && (
  <Map 
    center={{
      lat: job.parsedLocation.coordinates.lat,
      lng: job.parsedLocation.coordinates.lng
    }}
  />
)}
```

---

## 📝 API Reference

### Service Methods

#### `fetchActiveJobs(options)`

Fetch active LinkedIn jobs.

**Parameters**:
- `locationFilter` (string): Location search query
- `titleFilter` (string): Job title filter
- `typeFilter` (string): Employment types (comma-separated)
- `remote` (string): Remote work filter ('', 'true', 'false')
- `limit` (number): Maximum jobs to fetch

**Returns**: `Promise<Array>` - Raw LinkedIn job objects

#### `normalizeJobData(job)`

Normalize LinkedIn job to ExternalJob schema.

**Parameters**:
- `job` (Object): Raw LinkedIn job object

**Returns**: `Object` - Normalized job data

#### `fetchAndSaveJobs(options)`

Fetch jobs and save to database.

**Parameters**: Same as `fetchActiveJobs`

**Returns**: `Promise<Object>`
```javascript
{
  fetched: number,
  saved: number,
  duplicates: number,
  errors: number
}
```

---

## 🔗 Resources

- [LinkedIn Job Search API Docs](https://rapidapi.com/rockapis-rockapis-default/api/linkedin-job-search-api/)
- [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- [LinkedIn Jobs Website](https://www.linkedin.com/jobs/)

---

## ✅ Summary

The LinkedIn integration is **fully functional** and provides:

✅ Real-time job data (within 1 hour)  
✅ Rich company metadata  
✅ Precise location data with coordinates  
✅ Salary information  
✅ Automatic Karnataka filtering  
✅ Duplicate detection  
✅ Error handling  
✅ Rate limiting  

**Status**: ✨ **Production Ready** (pending API subscription activation)

---

*Last Updated: October 11, 2025*
