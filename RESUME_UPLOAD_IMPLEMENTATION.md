# Resume Upload Component - Implementation Guide

## Current Status

The Upload Resume component (`frontend/src/pages/UploadResume.jsx`) currently uses **mock data**. The backend has full functionality ready.

## Backend APIs Available

### Resume APIs (`/api/resume`)
- ✅ `POST /upload` - Upload and parse resume (requires authentication)
- ✅ `GET /parsed` - Get parsed resume data
- ✅ `GET /download` - Download original file
- ✅ `DELETE /` - Delete resume
- ✅ `GET /stats` - Get parsing statistics
- ✅ `PUT /parsed` - Update parsed data
- ✅ `POST /reparse` - Reparse with latest AI

### Matching APIs (`/api/matching`)
- ✅ `GET /recommendations` - Get job recommendations based on resume
- ✅ `POST /analyze` - Analyze match for specific job
- ✅ `GET /skills-gap` - Get skills gap analysis

## Frontend Integration Added

Added to `frontend/src/services/api.js`:
```javascript
// Resume API
export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getParsed: () => api.get('/resume/parsed'),
  // ... other methods
};

// Matching API
export const matchingAPI = {
  getRecommendations: (params) => api.get('/matching/recommendations', { params }),
  analyzeJob: (jobId) => api.post('/matching/analyze', { jobId }),
  getSkillsGap: (params) => api.get('/matching/skills-gap', { params }),
};
```

## Implementation Steps

### Step 1: Update `analyzeResume` function
Replace mock data with real API call:

```javascript
const analyzeResume = async (file) => {
  setAnalyzing(true);
  
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('resume', file);
    
    // Upload and parse resume
    const uploadResponse = await resumeAPI.upload(formData);
    const parsedData = uploadResponse.data.data.parsedResume;
    
    // Set resume data from API response
    setResumeData({
      name: parsedData.personalInfo?.name || 'N/A',
      email: parsedData.personalInfo?.email || 'N/A',
      phone: parsedData.personalInfo?.phone || 'N/A',
      skills: parsedData.skills || [],
      experience: `${parsedData.totalExperienceYears || 0} years`,
      education: parsedData.education?.[0]?.degree || 'N/A',
      location: parsedData.personalInfo?.location || 'N/A',
      summary: parsedData.summary || '',
    });
    
    // Get job recommendations
    const matchResponse = await matchingAPI.getRecommendations({ limit: 10 });
    const recommendations = matchResponse.data.data.recommendations;
    
    // Format matched jobs
    const formattedJobs = recommendations.map((rec, index) => ({
      id: rec.job._id,
      title: rec.job.title,
      company: rec.job.company,
      location: rec.job.location,
      salary: rec.job.salary ? `₹${rec.job.salary.min}-${rec.job.salary.max} LPA` : 'Not specified',
      matchScore: rec.matchPercentage,
      matchReasons: [
        `${rec.matchedSkills.length} of ${rec.job.requiredSkills?.length || 0} required skills match`,
        rec.experienceMatch.matches ? rec.experienceMatch.reason : 'Experience requirement not met',
        ...rec.matchedSkills.slice(0, 2).map(skill => `Strong in ${skill}`)
      ],
      type: rec.job.jobType || 'Full-time',
      posted: formatDistanceToNow(new Date(rec.job.createdAt), { addSuffix: true }),
    }));
    
    setMatchedJobs(formattedJobs);
    setAnalysisComplete(true);
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    // Show error message to user
    alert(error.response?.data?.message || 'Failed to analyze resume. Please try again.');
  } finally {
    setAnalyzing(false);
  }
};
```

### Step 2: Add Authentication Check
```javascript
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'useState';

export default function UploadResume() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      alert('Please login to upload your resume');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'jobseeker') {
      alert('Only job seekers can upload resumes');
      navigate('/');
      return;
    }
  }, [navigate]);
  
  // ... rest of component
}
```

### Step 3: Update "Apply Now" Button
```javascript
const handleApply = async (jobId) => {
  try {
    await applicationsAPI.apply({ jobId });
    alert('Application submitted successfully!');
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to apply');
  }
};

// In JSX:
<button 
  onClick={() => handleApply(job.id)}
  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600..."
>
  Apply Now
</button>
```

### Step 4: Update "View Details" Button
```javascript
<button 
  onClick={() => navigate(`/jobs/${job.id}`)}
  className="px-4 py-2.5 border-2 border-gray-300..."
>
  View Details
</button>
```

## Required Imports

Add these imports to `UploadResume.jsx`:
```javascript
import { resumeAPI, matchingAPI, applicationsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
```

## Testing Checklist

- [ ] User must be logged in as job seeker
- [ ] File upload works (PDF, DOC, DOCX)
- [ ] Resume parsing shows real data
- [ ] Job recommendations are fetched
- [ ] Match scores are calculated correctly
- [ ] Apply button works
- [ ] View details navigates to job page
- [ ] Error handling works
- [ ] Loading states display correctly

## Notes

- Backend requires authentication (JWT token)
- Only job seekers can upload resumes
- File size limit: 5MB
- Supported formats: PDF, DOC, DOCX
- AI parsing uses OpenAI GPT model
- Match scoring: 70% skills + 30% experience

## Next Steps

1. Update UploadResume.jsx with real API integration
2. Test with actual resume files
3. Handle edge cases (no matches, parsing errors)
4. Add loading indicators
5. Improve error messages
