# Frontend-Backend Mismatch Debugging Guide

## Issue
Frontend is not showing the same results as the backend.

## Steps to Debug

### 1. Check Backend is Running
```bash
# In backend directory
npm run dev
```
Backend should be running on `http://localhost:5000`

### 2. Test Backend API Directly
```bash
# In backend directory
node test-api-endpoint.js
```

This will test:
- All jobs (no filter)
- workMode=hybrid filter
- jobType=full-time filter
- jobType=internship filter
- Combined filters

**Expected Output:**
- Status: 200
- Total Jobs count
- Jobs Returned count
- Sample job data

### 3. Check Frontend Console
Open browser DevTools (F12) and check Console tab for:
```
[Jobs Page] API Response: {...}
[Jobs Page] Jobs: [...]
[Jobs Page] Pagination: {...}
[Jobs Page] Filters: {...}
```

### 4. Check Backend Console
When you apply filters in frontend, backend should log:
```
[DEBUG] JobType filter: input="full-time", normalized="fulltime", pattern="..."
[DEBUG] Count results: internal=X, external=Y, total=Z, actualJobs=W
```

### 5. Check Network Tab
In browser DevTools, Network tab:
1. Filter by "jobs"
2. Click on the request
3. Check:
   - Request URL (should include filter params)
   - Response data (should match backend)

## Common Issues

### Issue 1: No Results Showing
**Symptoms:** Count shows jobs but list is empty

**Check:**
- Frontend console for errors
- `jobs` array in response
- React rendering errors

### Issue 2: Count Mismatch
**Symptoms:** "322 Jobs Found" but "Showing 19 jobs"

**Fixed:** Count query now uses same filters as fetch query

### Issue 3: Wrong Jobs Displayed
**Symptoms:** Jobs don't match the filter

**Check:**
- Backend debug logs show correct pattern
- Sample jobs in backend match filter
- Frontend is sending correct filter values

### Issue 4: Frontend Not Updating
**Symptoms:** Filter changes don't trigger new request

**Check:**
- `searchParams` in URL
- React Query cache
- `applyFilters()` function is called

## Debug Checklist

- [ ] Backend server is running
- [ ] Backend API test returns correct data
- [ ] Frontend console shows API response
- [ ] Network tab shows request with correct params
- [ ] Backend console shows debug logs
- [ ] Jobs array is not empty
- [ ] Pagination data is correct
- [ ] No JavaScript errors in console

## Quick Fixes

### Clear React Query Cache
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Force Refetch
```javascript
// In browser console
window.location.href = window.location.href.split('?')[0];
```

### Check API Response Structure
```javascript
// In browser console
fetch('http://localhost:5000/api/jobs?workMode=hybrid')
  .then(r => r.json())
  .then(d => console.log(d));
```

## Expected Data Flow

1. **User selects filter** → Updates `filters` state
2. **User clicks "Apply Filters"** → Calls `applyFilters()`
3. **applyFilters()** → Updates `searchParams`
4. **searchParams change** → Triggers React Query refetch
5. **React Query** → Calls `jobsAPI.getAll(params)`
6. **Backend** → Applies filters, returns jobs
7. **Frontend** → Displays jobs from response

## Response Structure

Backend sends:
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 17,
      "totalJobs": 322,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {...}
  }
}
```

Frontend accesses:
```javascript
const jobs = data?.data?.data?.jobs || [];
const pagination = data?.data?.data?.pagination || {};
```

Note: `data?.data?.data` because:
- First `data` = axios response object
- Second `data` = response.data
- Third `data` = backend's data object
