# Karnataka Job Portal API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 📌 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "jobseeker",
  "phone": "9876543210",
  "location": "Bangalore, Karnataka",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "jobseeker"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Profile
```http
GET /auth/profile
Headers: Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "skills": ["JavaScript", "TypeScript", "React"],
  "location": "Bangalore"
}
```

### Change Password
```http
PUT /auth/change-password
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 💼 Job Endpoints

### Get All Jobs
```http
GET /jobs?page=1&limit=20&search=developer&location=Bangalore&skills=React,Node.js&jobType=full-time&source=all
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search query
- `location` (optional): Location filter
- `skills` (optional): Comma-separated skills
- `jobType` (optional): full-time, part-time, contract, freelance, internship
- `workMode` (optional): onsite, remote, hybrid
- `source` (optional): internal, external, all (default: all)
- `salaryMin` (optional): Minimum salary
- `salaryMax` (optional): Maximum salary

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "64abc...",
        "title": "Senior React Developer",
        "company": "Tech Corp",
        "location": "Bangalore, Karnataka",
        "description": "...",
        "requiredSkills": ["React", "JavaScript", "Node.js"],
        "salary": {
          "min": 800000,
          "max": 1200000,
          "currency": "INR",
          "period": "annual"
        },
        "jobType": "full-time",
        "workMode": "remote",
        "status": "active",
        "createdAt": "2025-01-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalJobs": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Job by ID
```http
GET /jobs/:id?source=internal
```

### Create Job (Admin Only)
```http
POST /jobs
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "description": "We are looking for an experienced React developer...",
  "company": "Tech Corp India",
  "location": "Bangalore, Karnataka",
  "jobType": "full-time",
  "workMode": "hybrid",
  "requiredSkills": ["React", "JavaScript", "TypeScript", "Node.js"],
  "experience": {
    "min": 3,
    "max": 6
  },
  "salary": {
    "min": 800000,
    "max": 1200000,
    "currency": "INR",
    "period": "annual"
  },
  "education": "bachelors",
  "applicationDeadline": "2025-02-28T23:59:59.000Z",
  "responsibilities": [
    "Build reusable components",
    "Optimize application performance"
  ],
  "requirements": [
    "3+ years React experience",
    "Strong JavaScript fundamentals"
  ]
}
```

### Update Job (Admin Only)
```http
PUT /jobs/:id
Headers: Authorization: Bearer <admin_token>
```

### Delete Job (Admin Only)
```http
DELETE /jobs/:id
Headers: Authorization: Bearer <admin_token>
```

### Get Admin's Jobs
```http
GET /jobs/admin/my-jobs?page=1&limit=10&status=active
Headers: Authorization: Bearer <admin_token>
```

### Get Job Statistics (Admin)
```http
GET /jobs/admin/stats
Headers: Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobStats": {
      "active": 45,
      "paused": 5,
      "closed": 10,
      "draft": 2,
      "totalViews": 5420,
      "totalApplications": 234
    },
    "applicationStats": {
      "applied": 156,
      "reviewing": 45,
      "shortlisted": 20,
      "interview": 8,
      "rejected": 3,
      "accepted": 2
    }
  }
}
```

---

## 📝 Application Endpoints

### Apply for Job
```http
POST /applications/apply
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobId": "64abc123...",
  "coverLetter": "I am excited to apply for this position..."
}
```

### Get My Applications
```http
GET /applications/my-applications?page=1&limit=10&status=applied
Headers: Authorization: Bearer <token>
```

### Get Application Statistics
```http
GET /applications/stats
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 25,
      "applied": 10,
      "reviewing": 8,
      "shortlisted": 4,
      "interview": 2,
      "accepted": 1
    },
    "recentApplications": [...],
    "summary": {
      "totalApplications": 25,
      "pendingApplications": 24,
      "successfulApplications": 1,
      "responseRate": 60
    }
  }
}
```

### Withdraw Application
```http
PUT /applications/:id/withdraw
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Found another opportunity"
}
```

### Get All Applications (Admin)
```http
GET /applications/admin/all?page=1&status=applied&jobId=64abc...&search=john
Headers: Authorization: Bearer <admin_token>
```

### Update Application Status (Admin)
```http
PUT /applications/admin/:id/status
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "shortlisted",
  "notes": "Strong candidate, moving to next round",
  "interviewDetails": {
    "date": "2025-02-15",
    "time": "10:00 AM",
    "mode": "video",
    "location": "Zoom Meeting"
  }
}
```

### Get Applications for Job (Admin)
```http
GET /applications/admin/job/:jobId?page=1&status=applied
Headers: Authorization: Bearer <admin_token>
```

---

## 📄 Resume Endpoints

### Upload Resume
```http
POST /resume/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `resume`: File (PDF, DOCX, or TXT)

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "data": {
    "parsedResume": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": [...],
      "education": [...],
      "totalExperienceYears": 5
    },
    "parsingStats": {
      "model": "gpt-3.5-turbo",
      "confidence": 0.8,
      "skillsExtracted": 12,
      "experienceEntries": 3,
      "educationEntries": 2
    }
  }
}
```

### Get Parsed Resume
```http
GET /resume/parsed
Headers: Authorization: Bearer <token>
```

### Download Resume
```http
GET /resume/download
Headers: Authorization: Bearer <token>
```

### Update Parsed Resume
```http
PUT /resume/parsed
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "skills": ["JavaScript", "TypeScript", "React", "Vue"],
  "totalExperienceYears": 6,
  "currentRole": "Senior Developer"
}
```

### Reparse Resume
```http
POST /resume/reparse
Headers: Authorization: Bearer <token>
```

### Get Resume Stats
```http
GET /resume/stats
Headers: Authorization: Bearer <token>
```

---

## 🔄 Job Matching Endpoints

### Get Recommendations
```http
GET /matching/recommendations?limit=10
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "job": {...},
        "matchPercentage": 85,
        "matchedSkills": ["React", "JavaScript", "Node.js"],
        "missingSkills": ["TypeScript"],
        "experienceMatch": {
          "matches": true,
          "reason": "Your 5 years matches requirement (3-7 years)"
        }
      }
    ],
    "matchBasis": {
      "skills": 12,
      "experience": 5,
      "education": 2
    }
  }
}
```

### Analyze Job Match
```http
POST /matching/analyze
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobId": "64abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "64abc123...",
      "title": "React Developer",
      "company": "Tech Corp"
    },
    "matchAnalysis": {
      "overallScore": 82,
      "overallRating": "Excellent",
      "skills": {
        "matchPercentage": 85,
        "matched": ["React", "JavaScript"],
        "missing": ["TypeScript"],
        "totalRequired": 3
      },
      "experience": {
        "matches": true,
        "reason": "Your 5 years matches requirement"
      },
      "recommendation": "Excellent match! You should definitely apply."
    }
  }
}
```

### Skills Gap Analysis
```http
GET /matching/skills-gap?targetRole=React Developer
Headers: Authorization: Bearer <token>
```

---

## 🌐 External Jobs Endpoints

### Get External Jobs
```http
GET /external-jobs?page=1&source=indeed&location=Karnataka
```

### Get External Job Stats
```http
GET /external-jobs/stats
```

### Trigger Manual Scraping (Admin)
```http
POST /external-jobs/admin/scrape
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "searchQueries": ["software developer", "web developer"],
  "location": "Karnataka",
  "sources": ["indeed"],
  "maxPagesPerQuery": 2
}
```

### Get Scheduler Status (Admin)
```http
GET /external-jobs/admin/scheduler/status
Headers: Authorization: Bearer <admin_token>
```

### Start/Stop Scheduler (Admin)
```http
POST /external-jobs/admin/scheduler/start
POST /external-jobs/admin/scheduler/stop
Headers: Authorization: Bearer <admin_token>
```

---

## 👥 User Management Endpoints (Admin)

### Get All Users
```http
GET /users/admin/all?page=1&role=jobseeker&search=john
Headers: Authorization: Bearer <admin_token>
```

### Get User by ID
```http
GET /users/admin/:id
Headers: Authorization: Bearer <admin_token>
```

### Update User Status
```http
PUT /users/admin/:id/status
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "isActive": false
}
```

### Delete User
```http
DELETE /users/admin/:id
Headers: Authorization: Bearer <admin_token>
```

### Get User Statistics
```http
GET /users/admin/stats
Headers: Authorization: Bearer <admin_token>
```

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-01-11T10:00:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🔐 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour

---

## 📊 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response includes:**
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 Search & Filtering

Most endpoints support advanced filtering:

- **Text Search**: `search` parameter
- **Location**: `location` parameter (case-insensitive)
- **Skills**: `skills` parameter (comma-separated)
- **Date Range**: `startDate` and `endDate` parameters
- **Status**: `status` parameter
- **Sorting**: `sortBy` and `order` (asc/desc) parameters

---

## Example Usage (cURL)

### Register and Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"jobseeker"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -H "Authorization: Bearer <token>" \
  -F "resume=@/path/to/resume.pdf"
```

### Search Jobs
```bash
curl "http://localhost:5000/api/jobs?search=developer&location=Bangalore&skills=React"
```

### Apply for Job
```bash
curl -X POST http://localhost:5000/api/applications/apply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"64abc123...","coverLetter":"I am interested..."}'
```

---

## WebSocket Events (Future Feature)

Coming soon:
- Real-time application status updates
- New job notifications
- Chat with recruiters

---

**For support:** Check the main README.md or create an issue on GitHub.