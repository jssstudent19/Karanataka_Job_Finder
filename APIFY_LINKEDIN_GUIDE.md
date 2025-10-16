# 📘 Apify LinkedIn Integration Guide

## Overview
Your Karnataka Job Portal now integrates LinkedIn jobs scraped via Apify actors. This provides stable, reliable LinkedIn job data without cookie expiration issues.

## Current Status ✅
- **100 LinkedIn jobs** successfully integrated
- Source: `apify-linkedin`
- Stored in MongoDB database
- Displayed in frontend with LinkedIn branding
- Jobs are from Karnataka locations (Bangalore/Bengaluru)

## How to Add New LinkedIn Jobs

### Step 1: Run Apify Actor
1. Go to [Apify Console](https://console.apify.com/)
2. Run your LinkedIn Jobs Scraper actor with Karnataka location filters
3. Wait for the actor run to complete
4. Copy the **Run ID** from the URL (e.g., `wBC2ccCnWOmZcVB0J`)

### Step 2: Import Jobs to Your Portal
Run the test script with your new Run ID:

```bash
cd C:\Karnataka_Job_Portal\backend
node test-apify-linkedin.js
```

Or create a one-time script:

```javascript
// quick-import-linkedin.js
require('dotenv').config();
const apifyService = require('./services/apifyLinkedInService');
const mongoose = require('mongoose');

async function importJobs() {
  const RUN_ID = 'YOUR_APIFY_RUN_ID_HERE'; // Update this!
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to database\n');
  
  const results = await apifyService.fetchAndSaveJobs(RUN_ID);
  
  console.log(`\n✅ Imported ${results.saved} new LinkedIn jobs!`);
  console.log(`🔄 Updated ${results.updated} existing jobs`);
  
  await mongoose.disconnect();
  process.exit();
}

importJobs();
```

Run it:
```bash
node quick-import-linkedin.js
```

## Configuration

### Environment Variables (.env)
```bash
# Apify API Token
APIFY_API_TOKEN=your_apify_api_token_here
```

### Apify Service Location
`backend/services/apifyLinkedInService.js`

### Database Model
Jobs are stored in the `ExternalJob` collection with:
- `source: 'apify-linkedin'`
- `externalId: 'apify-linkedin-{jobId}'`
- Duplicate detection by `externalId`

## Features

### ✅ What Works
- Fetches LinkedIn jobs from Apify actor runs via API
- Automatic duplicate prevention
- Experience level mapping (LinkedIn → your schema)
- Job type normalization
- Work mode detection (Remote/Hybrid/On-site)
- Frontend display with LinkedIn branding (blue badge)
- Filter by LinkedIn source
- Direct LinkedIn application URLs

### 📋 Job Data Captured
- Job title, company, location
- Full job description
- Posted date
- Job type (Full-time, Part-time, etc.)
- Work mode (Remote, On-site, Hybrid)
- Experience level (entry, junior, mid, senior, lead, executive)
- LinkedIn application URL
- Company details (logo, website, employee count)
- Job poster information

## Maintenance

### Check LinkedIn Job Stats
```bash
curl "http://localhost:5000/api/external-jobs/stats"
```

### View LinkedIn Jobs in Frontend
Navigate to: **http://localhost:3000/external-jobs**
- Filter by source: "LinkedIn"
- See stats at the top showing job counts

### Clean Up Old Jobs
LinkedIn jobs older than 60 days are automatically marked as expired by the ExternalJob model.

You can manually clean them:
```javascript
const ExternalJob = require('./src/models/ExternalJob');
await ExternalJob.cleanupExpired();
```

## Advantages Over Cookie Scraping

| Cookie Scraping | Apify Integration |
|----------------|-------------------|
| ❌ Cookies expire frequently | ✅ API token stays valid |
| ❌ LinkedIn blocks requests | ✅ No blocking issues |
| ❌ Manual cookie updates | ✅ Automatic via Apify |
| ❌ Rate limits & 403 errors | ✅ Reliable API access |
| ❌ Maintenance heavy | ✅ Low maintenance |

## Costs
- Apify has a free tier with compute units
- Pay-as-you-go for additional usage
- Much more cost-effective than enterprise LinkedIn API

## Support Files

### Backend Files
- `services/apifyLinkedInService.js` - Apify integration service
- `test-apify-linkedin.js` - Test import script
- `src/models/ExternalJob.js` - Database model (source enum includes `apify-linkedin`)

### Frontend Files
- `src/pages/ExternalJobs.jsx` - Updated with LinkedIn source colors and names

## Troubleshooting

### "APIFY_API_TOKEN not configured"
Add your Apify API token to `.env`:
```bash
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx
```

### "Source validation failed"
The `apify-linkedin` source has been added to the ExternalJob schema enum.
If you still see this error, restart your backend server.

### Jobs Not Appearing in Frontend
1. Check backend is running: `http://localhost:5000`
2. Check API response: `curl "http://localhost:5000/api/external-jobs/stats"`
3. Verify frontend is running: `http://localhost:3000`
4. Clear browser cache and refresh

### No Jobs Returned from Apify
- Verify the Run ID is correct
- Check the Apify actor run completed successfully
- Ensure your Apify API token has access to the run

## Next Steps

### Automate Job Refresh
Create a scheduled job (cron/scheduled task) to automatically import fresh LinkedIn jobs:

```javascript
// scheduled-linkedin-import.js
const cron = require('node-cron');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled LinkedIn import...');
  // Trigger new Apify run and import results
});
```

### Quality Improvements
The `qualityScore` field is currently 0. Enhance it by:
```javascript
job.calculateQualityScore(); // Scores jobs based on completeness
await job.save();
```

## Summary

🎉 **Your portal now has 100 fresh LinkedIn jobs!**

- LinkedIn is displayed as a premium source (blue badge)
- Jobs are real Karnataka opportunities
- Integration is stable and maintenance-free
- You can refresh jobs anytime via Apify actor runs

For questions or issues, check the Apify documentation at https://docs.apify.com/
