# 📘 Naukri & Indeed Integration Guide

## Overview
Your Karnataka Job Portal now includes **Naukri** and **Indeed** jobs scraped via Apify actors. These integrate seamlessly with your existing job sources.

## Current Status ✅
- **96 Naukri jobs** successfully integrated
- **25 Indeed jobs** successfully integrated
- **Total: 320 active jobs** from 6 sources
- All jobs from Karnataka locations

## Sources Created

### 1. Apify Naukri Service
**File**: `backend/services/apifyNaukriService.js`

**Features**:
- Fetches Naukri jobs from Apify actor runs
- Extracts salary, skills, experience, company info
- Maps Naukri experience years to our schema levels
- Handles AmbitionBox benefits data
- Supports WFH/Remote/Hybrid detection

**Run IDs**:
- Current: `zgVQiJv33OPFNgrAm` (98 jobs fetched, 96 saved)

### 2. Apify Indeed Service
**File**: `backend/services/apifyIndeedService.js`

**Features**:
- Fetches Indeed jobs from Apify actor runs
- Parses "X days ago" posting dates
- Maps job types (Fresher, Full-time, etc.)
- Includes company ratings & reviews
- Remote/Hybrid detection

**Run IDs**:
- Current: `kPNzoCL0cVJChR4kh` (25 jobs fetched, 25 saved)

## How to Import New Jobs

### Quick Import (Both Sources)
```bash
cd C:\Karnataka_Job_Portal\backend
node import-naukri-indeed.js
```

This will:
1. Fetch from latest Naukri Apify run
2. Fetch from latest Indeed Apify run
3. Save to database with duplicate prevention
4. Show detailed stats

### Update Run IDs
Edit `import-naukri-indeed.js`:
```javascript
const naukriRunId = 'YOUR_NEW_NAUKRI_RUN_ID';
const indeedRunId = 'YOUR_NEW_INDEED_RUN_ID';
```

### Import Individually

**Naukri Only**:
```javascript
const naukriService = require('./services/apifyNaukriService');
const results = await naukriService.fetchAndSaveJobs('RUN_ID_HERE');
```

**Indeed Only**:
```javascript
const indeedService = require('./services/apifyIndeedService');
const results = await indeedService.fetchAndSaveJobs('RUN_ID_HERE');
```

## Database Schema

### Source Names
- `apify-naukri` - Naukri jobs via Apify
- `apify-indeed` - Indeed jobs via Apify

Both are already added to the `ExternalJob` source enum.

### Job Data Captured

**Naukri Jobs Include**:
- ✅ Full job description with HTML
- ✅ Salary range (min/max in INR)
- ✅ Key skills (preferred + other)
- ✅ Experience level (mapped from years)
- ✅ Company details + industry
- ✅ AmbitionBox ratings & benefits
- ✅ Multiple locations
- ✅ Work mode (WFH/Remote/On-site)

**Indeed Jobs Include**:
- ✅ Job description
- ✅ Job type tags (Fresher, Full-time, etc.)
- ✅ Company ratings & review count
- ✅ External apply link
- ✅ Posting date (parsed from relative format)
- ✅ Work mode detection
- ✅ Experience level from job type

## Frontend Integration

### Source Colors
- **Naukri**: Indigo badge (`bg-indigo-600 text-white`)
- **Indeed**: Red badge (`bg-red-600 text-white`)

### Filtering
Both sources appear in:
- Source filter dropdown
- Stats header (job count by source)
- Individual job cards with colored badges

### View Jobs
Navigate to: **http://localhost:3000/external-jobs**
- Filter by "Naukri" or "Indeed"
- See job counts in stats
- Click to view full details

## Sample Jobs

### Naukri Example
- **Title**: Zonal Head (Admissions & Outreach)
- **Company**: upGrad
- **Location**: Pune, Bengaluru, Delhi/NCR
- **Salary**: ₹15-18 Lacs PA
- **Experience**: 6-10 years
- **Skills**: Admissions, Team Management, Revenue Generation

### Indeed Example
- **Title**: Process Executive
- **Company**: Infosys BPM Limited
- **Location**: Bengaluru, Karnataka
- **Type**: Fresher, Full-time
- **Rating**: 3.8 ⭐ (16,656 reviews)

## Maintenance

### Refresh Jobs
1. Run Apify actors for Naukri/Indeed with Karnataka filter
2. Get the new Run IDs
3. Update `import-naukri-indeed.js`
4. Run: `node import-naukri-indeed.js`

### Check Stats
```bash
curl "http://localhost:5000/api/external-jobs/stats"
```

### View by Source
- **Naukri**: `http://localhost:5000/api/external-jobs?source=apify-naukri`
- **Indeed**: `http://localhost:5000/api/external-jobs?source=apify-indeed`

## Troubleshooting

### "Company description cannot exceed 2000 characters"
✅ **Fixed!** The service now automatically trims company descriptions to 2000 characters.

### No Jobs Returned
- Verify Run ID is correct
- Check Apify actor completed successfully
- Ensure APIFY_API_TOKEN in `.env`

### Jobs Not Showing in Frontend
1. Verify backend server is running
2. Check API: `curl "http://localhost:5000/api/external-jobs/stats"`
3. Refresh frontend browser cache
4. Check browser console for errors

## File Structure

```
backend/
├── services/
│   ├── apifyNaukriService.js      # Naukri integration
│   ├── apifyIndeedService.js      # Indeed integration
│   └── apifyLinkedInService.js    # LinkedIn (existing)
├── import-naukri-indeed.js        # Import script
└── src/
    └── models/
        └── ExternalJob.js         # Updated with new sources

frontend/
└── src/
    └── pages/
        └── ExternalJobs.jsx       # Updated with badges
```

## API Endpoints

### Get All Jobs
```
GET /api/external-jobs
GET /api/external-jobs?source=apify-naukri
GET /api/external-jobs?source=apify-indeed
```

### Get Stats
```
GET /api/external-jobs/stats
```

### Response Format
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "apify-naukri",
        "totalJobs": 96,
        "activeJobs": 96,
        "averageQuality": 0
      }
    ]
  }
}
```

## Advantages

| Feature | Naukri | Indeed |
|---------|--------|--------|
| Job Volume | ✅ High (96 jobs) | ✅ Medium (25 jobs) |
| Salary Data | ✅ Detailed (min/max/currency) | ❌ Text only |
| Skills | ✅ Structured | ❌ Not extracted |
| Company Info | ✅ Extensive (AmbitionBox) | ✅ Ratings only |
| Location | ✅ Multiple cities | ✅ Single city |
| Benefits | ✅ AmbitionBox data | ❌ Not available |

## Summary

🎉 **Your Karnataka Job Portal now has 320 active jobs from 6 reliable sources!**

**Integrated via Apify** (No cookie issues!):
- ✅ LinkedIn: 100 jobs
- ✅ Naukri: 96 jobs  
- ✅ Indeed: 25 jobs

**Direct API Integration**:
- ✅ Careerjet: 49 jobs
- ✅ JSearch: 47 jobs
- ✅ Adzuna: 3 jobs

All jobs are:
- ✅ From Karnataka locations
- ✅ Properly normalized to your schema
- ✅ Displayed with source badges
- ✅ Filterable and searchable
- ✅ Duplicate-protected

For questions or issues, check the Apify documentation at https://docs.apify.com/

---

**Next Steps**: Set up automated daily imports using cron or scheduled tasks to keep job listings fresh!
