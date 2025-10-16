# Resume Parsing Troubleshooting Guide

## Issue: Poor Parsing Results

When uploading a PDF resume, the parsing shows:
```
Name: N/A
Experience: 0 years
Location: N/A
Education: N/A
```

## Root Causes

### 1. **PDF Text Extraction Quality**
- Some PDFs have poor text extraction (scanned images, complex layouts)
- Text might be extracted but in wrong order or format
- Special characters or formatting can break extraction

### 2. **AI API Issues**
- Gemini AI might be rate-limited
- API key might be invalid or expired
- Network timeout or connectivity issues
- AI returning null/empty values

### 3. **Data Structure Mismatch**
- Frontend was looking for `personalInfo.name` but backend returns flat `name`
- **FIXED**: Updated frontend to match backend structure

## Fixes Applied

### ✅ Fix 1: Updated Frontend Data Mapping
**File:** `frontend/src/pages/UploadResume.jsx`

Changed from:
```javascript
name: parsedData.personalInfo?.name || 'N/A'
```

To:
```javascript
name: parsedData.name || 'Not found'
```

### ✅ Fix 2: Added Better Logging
**File:** `backend/src/services/resumeParser.js`

Added detailed logging:
- Text extraction length
- AI response preview
- Parsed data summary
- Error details

### ✅ Fix 3: Email Validation Fix
**File:** `backend/src/models/ParsedResume.js`

Made email validation optional (only validates if present)

### ✅ Fix 4: Data Sanitization
**File:** `backend/src/controllers/resumeController.js`

Automatically removes invalid emails and URLs before saving

## How to Debug

### Step 1: Check Backend Logs

When you upload a resume, check the backend console for:

```
Extracting text from resume file...
Parsing resume with Gemini AI (XXXX characters extracted)
Gemini AI response received
Resume parsing completed { name: 'John Doe', skillsCount: 5, ... }
```

### Step 2: Check for Errors

Look for these error messages:

**Text Extraction Failed:**
```
Failed to extract text from file: No text content could be extracted
```
→ PDF might be scanned image or corrupted

**AI Parsing Failed:**
```
Gemini AI parsing failed: { message: '...', response: {...} }
Falling back to basic parsing...
```
→ AI API issue, using fallback parser

**Validation Failed:**
```
ParsedResume validation failed: email: Please provide a valid email
```
→ Should be fixed now with sanitization

### Step 3: Test with Different Files

Try uploading:
1. ✅ **Text-based PDF** (created from Word/LaTeX)
2. ❌ **Scanned PDF** (image-based) - Won't work well
3. ✅ **DOCX file** - Usually works better
4. ✅ **Simple formatted resume** - Works best

## Gemini AI Configuration

Check `.env` file:
```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### Test Gemini API

You can test if the API key works:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Common Solutions

### Solution 1: Resume Format
**Problem:** Scanned PDF or image-based resume
**Fix:** Convert to text-based PDF or DOCX

### Solution 2: API Key
**Problem:** Gemini API not working
**Fix:** 
1. Get new API key from https://makersuite.google.com/app/apikey
2. Update `.env` file
3. Restart backend server

### Solution 3: Fallback Parser
**Problem:** AI parsing fails
**Result:** System uses basic regex-based parser
**Limitation:** Only extracts name, email, phone, basic skills

### Solution 4: Manual Edit
**Problem:** Parsing misses some data
**Fix:** Use the "Update Resume" API to manually add missing info

## API Endpoints for Manual Updates

### Update Parsed Resume
```javascript
PUT /api/resume/parsed
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["JavaScript", "React", "Node.js"],
  "totalExperienceYears": 5
}
```

### Reparse Resume
```javascript
POST /api/resume/reparse
```
Re-runs AI parsing on existing uploaded file

## Expected Data Structure

Backend returns:
```json
{
  "success": true,
  "data": {
    "parsedResume": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": {
        "city": "Bangalore",
        "state": "Karnataka"
      },
      "skills": ["JavaScript", "React"],
      "experience": [{...}],
      "education": [{...}],
      "totalExperienceYears": 5,
      "parsingModel": "gemini-2.5-flash",
      "parsingConfidence": 0.8
    }
  }
}
```

## Next Steps

1. **Try uploading again** - Frontend fix should show data correctly
2. **Check backend logs** - See what's being extracted
3. **Try different file format** - DOCX often works better than PDF
4. **Check API quota** - Gemini might have rate limits
5. **Use simpler resume** - Complex layouts can confuse parsers

## Alternative: Mock Data for Testing

If AI parsing continues to fail, you can temporarily use mock data in the controller for testing the UI.
