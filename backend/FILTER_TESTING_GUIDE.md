# Filter Testing Guide

## Step 1: Analyze Database Job Types

Run this to see all job types in the database:
```bash
node quick-check-jobtypes.js
```

This will show:
- All unique jobType values in external jobs
- All unique jobType values in internal jobs
- Total counts for each
- Test the "full-time" filter pattern

## Step 2: Comprehensive Analysis

Run this for detailed categorization:
```bash
node analyze-job-types.js
```

This will:
- List all unique job type values
- Categorize them (Full-time, Part-time, Contract, Internship, Freelance, Other)
- Test regex patterns for each category
- Show sample matches for verification

## Step 3: Test All Filters

Run this to test all filter combinations:
```bash
node test-all-filters.js
```

This tests:
- All work modes (onsite, remote, hybrid)
- All job types (full-time, part-time, contract, internship, freelance)
- Combined filters
- Regex pattern verification

## Step 4: Test via API

Start the backend server and test via the frontend or API:

### Test Full-time Filter:
```
GET http://localhost:5000/api/jobs?jobType=full-time
```

### Test Hybrid Filter:
```
GET http://localhost:5000/api/jobs?workMode=hybrid
```

### Test Combined:
```
GET http://localhost:5000/api/jobs?jobType=full-time&workMode=hybrid
```

## Debug Logging

The controller now has debug logging enabled. When you filter by jobType or workMode, check the console for:

```
[DEBUG] JobType filter: input="full-time", normalized="fulltime", pattern="f[-–\s]?u[-–\s]?l[-–\s]?l[-–\s]?t[-–\s]?i[-–\s]?m[-–\s]?e"
[DEBUG] Count results: internal=5, external=313, total=318, actualJobs=20
```

This shows:
- What pattern is being generated
- How many jobs were found in each collection
- Total count vs actual jobs returned (should match on first page)

## Expected Database Values

Based on previous tests:

### Work Modes:
- Internal: `onsite`, `remote`, `hybrid` (lowercase)
- External: `On-site`, `Remote`, `Hybrid` (capitalized with hyphen)

### Job Types:
- Internal: `full-time` (lowercase with hyphen)
- External: `Full-time`, `Full–time` (capitalized, may have en-dash), `Contract`, `Contractor`, `Internship`

## Verification Checklist

For each filter, verify:
- [ ] Count matches actual results on first page
- [ ] Pagination shows correct total pages
- [ ] Sample jobs actually have the filtered value
- [ ] Both internal and external jobs are included
- [ ] Case variations are matched (e.g., "Full-time" and "full-time")
- [ ] Hyphen variations are matched (e.g., "full-time" and "Full–time")

## Common Issues

1. **Count mismatch**: Count query not using same filters as fetch query
2. **No results**: Regex pattern too strict or not matching case/hyphen variations
3. **Too many results**: Pattern matching unintended values
4. **Missing external jobs**: External filter not applied correctly

## Fix Applied

The controller now:
1. Normalizes input by removing hyphens, en-dashes, and spaces
2. Creates flexible regex pattern that matches any variation
3. Uses the SAME filter logic for both fetch and count queries
4. Applies filters to both internal and external jobs
