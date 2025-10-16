# Karnataka Job Portal - Complete Setup Guide

## 🎯 What We've Built

A complete **AI-powered Job Portal MVP** with:
- ✅ User authentication (Admin & Job Seeker roles)
- ✅ Job management with advanced search
- ✅ Application tracking
- ✅ JWT-based security
- ✅ Comprehensive API documentation
- ✅ Testing infrastructure
- ⏳ Frontend (Next step!)

---

## 📋 Prerequisites

- Node.js (v18+) ✅ Installed
- MongoDB Atlas account (Free) - **Follow steps below**
- Code editor (VS Code recommended)

---

## 🚀 MongoDB Atlas Setup (5 Minutes)

### Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub or email
3. Verify email

### Step 2: Create Free Cluster
1. Choose **M0 FREE** tier (0$ forever)
2. **Cloud Provider**: AWS
3. **Region**: Choose closest (e.g., Mumbai for India)
4. **Cluster Name**: `karnataka-jobs-cluster`
5. Click **"Create"** button
6. Wait 3-5 minutes for cluster creation

### Step 3: Create Database User
1. Click **"Database Access"** (left sidebar)
2. Click **"ADD NEW DATABASE USER"**
3. **Username**: `karnataka_admin`
4. **Password**: Click "Autogenerate Secure Password" and **SAVE IT**
5. **Database User Privileges**: "Atlas admin" or "Read and write to any database"
6. Click **"Add User"**

### Step 4: Whitelist IP
1. Click **"Network Access"** (left sidebar)
2. Click **"ADD IP ADDRESS"**
3. Click **"ALLOW ACCESS FROM ANYWHERE"** (0.0.0.0/0)
   - For production, add specific IPs only
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** (left sidebar - home)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. **Copy** the connection string - looks like:
   ```
   mongodb+srv://karnataka_admin:<password>@karnataka-jobs-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **IMPORTANT**: Replace `<password>` with the password you saved in Step 3

### Step 6: Update .env File
1. Open `C:\Karnataka_Job_Portal\.env`
2. Find line starting with `MONGODB_URI=`
3. Replace it with your connection string from Step 5
4. **Add database name** before the `?` - Example:
   ```
   MONGODB_URI=mongodb+srv://karnataka_admin:YOUR_PASSWORD@karnataka-jobs-cluster.xxxxx.mongodb.net/karnataka_jobs_dev?retryWrites=true&w=majority
   ```
5. Save the file

---

## 🏃 Start the Backend

### 1. Open Terminal in Project Directory
```powershell
cd C:\Karnataka_Job_Portal
```

### 2. Start the Server
```powershell
npm start
```

**Expected Output:**
```
✓ MongoDB Connected: karnataka-jobs-cluster-shard-00-00.xxxxx.mongodb.net
🚀 Server running in development mode on port 5000
```

### 3. Test the API
Open browser or Postman and go to:
```
http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

---

## 🧪 Test the Backend Manually

### Using PowerShell (Windows)

#### 1. Register a Job Seeker
```powershell
$body = @{
    name = "Test User"
    email = "user@test.com"
    password = "password123"
    role = "jobseeker"
    skills = @("JavaScript", "React", "Node.js")
    location = "Bangalore"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Save the returned token!**

#### 2. Register an Admin
```powershell
$body = @{
    name = "Admin User"
    email = "admin@test.com"
    password = "admin123"
    role = "admin"
    permissions = @("manage_jobs", "manage_users")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Save the admin token!**

#### 3. Create a Job (As Admin)
```powershell
$adminToken = "YOUR_ADMIN_TOKEN_HERE"

$body = @{
    title = "Senior React Developer"
    description = "We need an experienced React developer"
    company = "Tech Corp"
    location = "Bangalore, Karnataka"
    jobType = "full-time"
    workMode = "hybrid"
    requiredSkills = @("React", "JavaScript", "TypeScript")
    experience = @{
        min = 3
        max = 6
    }
    salary = @{
        min = 800000
        max = 1200000
        currency = "INR"
        period = "annual"
    }
    education = "bachelors"
    status = "active"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" `
  -Method POST `
  -Headers @{Authorization="Bearer $adminToken"} `
  -ContentType "application/json" `
  -Body $body
```

#### 4. Get All Jobs (Public)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs"
```

#### 5. Login
```powershell
$body = @{
    email = "user@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 📱 Using Postman (Easier!)

### Import Collection

Create a new Postman collection with these requests:

**Base URL**: `http://localhost:5000/api`

#### 1. Register Job Seeker
- **POST** `/auth/register`
- **Body** (JSON):
```json
{
  "name": "Test User",
  "email": "user@test.com",
  "password": "password123",
  "role": "jobseeker",
  "skills": ["JavaScript", "React"],
  "location": "Bangalore"
}
```

#### 2. Login
- **POST** `/auth/login`
- **Body**:
```json
{
  "email": "user@test.com",
  "password": "password123"
}
```
- **Save the token from response!**

#### 3. Get Profile (Protected)
- **GET** `/auth/profile`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### 4. Create Job (Admin)
- **POST** `/jobs`
- **Headers**: `Authorization: Bearer ADMIN_TOKEN`
- **Body**:
```json
{
  "title": "React Developer",
  "description": "Looking for React dev",
  "company": "Tech Corp",
  "location": "Bangalore, Karnataka",
  "jobType": "full-time",
  "workMode": "remote",
  "requiredSkills": ["React", "JavaScript"],
  "experience": { "min": 2, "max": 5 },
  "salary": { "min": 600000, "max": 1000000 },
  "status": "active"
}
```

#### 5. Get All Jobs (Public)
- **GET** `/jobs`
- No authentication needed

#### 6. Search Jobs
- **GET** `/jobs?search=React&location=Bangalore&skills=JavaScript`

---

## ✅ Verify Everything Works

### Checklist:
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Can register new users
- [ ] Can login and get token
- [ ] Can create jobs as admin
- [ ] Can view jobs list
- [ ] Can search and filter jobs

---

## 🎨 Next Steps - Build Frontend

Once backend is working:

1. **Initialize React Frontend**
   ```powershell
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   ```

2. **Install Dependencies**
   ```powershell
   npm install axios react-router-dom @tanstack/react-query
   npm install -D tailwindcss postcss autoprefixer
   ```

3. **Start Frontend Dev Server**
   ```powershell
   npm run dev
   ```

4. **Build UI Components**
   - Login/Register pages
   - Job listings
   - Job details
   - Application forms
   - Admin dashboard

---

## 🐛 Troubleshooting

### Server won't start
- Check `.env` file exists
- Verify MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist

### MongoDB connection error
- Verify password in connection string
- Check Network Access in Atlas
- Ensure cluster is created

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and run `npm install`

### Port 5000 already in use
- Change PORT in `.env` to 5001 or another port

---

## 📚 Documentation

- **API Documentation**: `docs/API_DOCUMENTATION.md`
- **Testing Guide**: `docs/TESTING.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Quick Start**: `QUICKSTART.md`

---

## 🆘 Need Help?

- Check `STATUS.md` for current project state
- Review API docs for endpoint details
- Test endpoints with Postman collection

---

**🎉 You're all set! Once MongoDB is configured, run `npm start` and start building the frontend!**
