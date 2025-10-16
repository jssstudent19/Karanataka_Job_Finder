# Karnataka Job Portal - AI-Integrated MVP

An intelligent job portal system designed for Karnataka with advanced AI-powered resume parsing and comprehensive job management features.

## 🚀 Project Overview

The Karnataka Job Portal is a modern web application that connects job seekers with opportunities through intelligent matching and streamlined application processes. The system features AI-powered resume parsing, comprehensive job management, and admin-controlled job postings.

## 🏗️ Architecture

### System Components

- **Backend**: Node.js + Express.js RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **AI Integration**: OpenAI GPT models for resume parsing
- **File Processing**: Support for PDF, DOCX, TXT resume formats
- **Job Scraping**: Automated data collection from external sources (LinkedIn, Indeed)

### User Roles

1. **Job Seekers** (`jobseeker`)
   - Register and manage profiles
   - Upload and parse resumes with AI
   - Search and apply for jobs
   - Track application status

2. **Administrators** (`admin`)
   - Manage job postings
   - User management and analytics
   - Application processing
   - System configuration

## 📁 Project Structure

```
Karnataka_Job_Portal/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── database.js  # MongoDB connection
│   │   │   ├── logger.js    # Winston logger setup
│   │   │   └── multer.js    # File upload configuration
│   │   ├── controllers/     # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── jobController.js
│   │   │   ├── applicationController.js
│   │   │   └── resumeController.js
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.js      # Authentication & authorization
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── models/          # Database models
│   │   │   ├── User.js      # User accounts
│   │   │   ├── Job.js       # Job postings
│   │   │   ├── Application.js
│   │   │   ├── ParsedResume.js
│   │   │   └── ExternalJob.js
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js
│   │   │   ├── jobs.js
│   │   │   ├── applications.js
│   │   │   ├── resume.js
│   │   │   └── user.js
│   │   ├── services/        # Business logic
│   │   │   └── resumeParser.js
│   │   └── index.js         # Main server file
│   ├── package.json
│   └── .env.example
├── frontend/               # React frontend (to be implemented)
├── docs/                   # Documentation
└── scripts/               # Utility scripts
```

## 🛠️ Current Implementation Status

### ✅ Completed Features

#### 1. **Authentication System**
- JWT-based authentication
- Role-based access control (Job Seekers, Admins)
- Secure password hashing with bcrypt
- User registration and login
- Profile management

#### 2. **Database Models**
- **User Model**: Complete user management with role-based fields
- **Job Model**: Comprehensive job posting structure
- **Application Model**: Full application lifecycle tracking
- **ParsedResume Model**: AI-extracted resume data storage
- **ExternalJob Model**: Scraped job data management

#### 3. **Resume Processing System**
- File upload support (PDF, DOCX, TXT)
- AI-powered resume parsing using OpenAI GPT
- Structured data extraction:
  - Personal information
  - Skills and experience
  - Education and certifications
  - Projects and achievements
  - Professional summary
- Fallback parsing for AI failures

#### 4. **Job Management System**
- Admin-controlled job posting
- Advanced job search and filtering
- Job categorization and tagging
- Application deadline management
- View tracking and analytics

#### 5. **Application Management**
- One-click job applications
- Application status tracking
- Resume version control
- Withdrawal functionality
- Admin application processing

#### 6. **API Endpoints**
Complete RESTful API with the following routes:

**Authentication Routes** (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password
- `POST /logout` - User logout

**Job Routes** (`/api/jobs`)
- `GET /` - Get all jobs (public)
- `GET /search` - Advanced job search
- `POST /` - Create job (admin only)
- `GET /:id` - Get single job
- `PUT /:id` - Update job (admin only)
- `DELETE /:id` - Delete job (admin only)
- `GET /admin/my-jobs` - Admin's jobs
- `GET /admin/stats` - Job statistics

**Application Routes** (`/api/applications`)
- `POST /apply` - Apply for job
- `GET /my-applications` - User's applications
- `GET /stats` - Application statistics
- `PUT /:id/withdraw` - Withdraw application
- `GET /admin/all` - All applications (admin)
- `PUT /admin/:id/status` - Update status (admin)

**Resume Routes** (`/api/resume`)
- `POST /upload` - Upload and parse resume
- `GET /parsed` - Get parsed resume data
- `GET /download` - Download original resume
- `DELETE /` - Delete resume
- `PUT /parsed` - Update parsed data
- `POST /reparse` - Reparse with latest AI

**User Management Routes** (`/api/users`)
- `GET /admin/all` - Get all users (admin)
- `GET /admin/:id` - Get user details (admin)
- `PUT /admin/:id/status` - Update user status (admin)
- `DELETE /admin/:id` - Delete user (admin)
- `GET /admin/stats` - User statistics (admin)

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- OpenAI API key

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/karnataka_job_portal

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Karnataka_Job_Portal
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create required directories**
   ```bash
   mkdir logs uploads
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API server will be running at `http://localhost:5000`

## 📚 API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format

All API responses follow this structure:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {
    // Response data
  }
}
```

### Error Handling

Errors are returned with appropriate HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## 🤖 AI Integration

### Resume Parsing

The system uses OpenAI's GPT models to parse resumes and extract structured data:

- **Input**: PDF, DOCX, or TXT resume files
- **Processing**: Text extraction → AI parsing → Data validation
- **Output**: Structured JSON with personal info, skills, experience, education, projects, etc.
- **Fallback**: Basic regex-based parsing if AI fails

### Supported Data Extraction

- Personal Information (name, email, phone, location)
- Professional Summary/Objective
- Technical and Soft Skills
- Work Experience with responsibilities and achievements
- Education background
- Projects with technologies used
- Certifications and awards
- Social profiles (LinkedIn, GitHub, portfolio)

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive data validation
- **Role-Based Access**: Admin and user permission levels
- **File Upload Security**: Type and size restrictions
- **Error Handling**: Secure error messages

## 📊 Database Schema

### Collections

1. **users** - User accounts and profiles
2. **jobs** - Job postings and details
3. **applications** - Job application records
4. **parsedresumes** - AI-extracted resume data
5. **externaljobs** - Scraped job listings

### Indexing Strategy

- Compound indexes for efficient queries
- Text search indexes for job and resume search
- Geographic indexes for location-based searches

## 🚧 Pending Features

### High Priority
1. **Job Scraping Service** - Automated LinkedIn/Indeed scraping
2. **React Frontend** - Complete user interface
3. **AI Job Matching** - Skill-based job recommendations

### Medium Priority
1. **Real-time Notifications** - Application status updates
2. **Advanced Analytics** - Comprehensive reporting
3. **Email Integration** - Automated notifications

### Low Priority
1. **Mobile App** - React Native implementation
2. **Advanced Search** - ML-powered search improvements
3. **Video Interviews** - Integrated interview scheduling

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📈 Performance Considerations

- **Database Optimization**: Proper indexing and aggregation
- **File Handling**: Efficient binary storage in MongoDB
- **API Caching**: Response caching for frequently accessed data
- **Rate Limiting**: Protection against API abuse
- **Compression**: gzip compression for responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review API endpoints at `http://localhost:5000/api`

---

**Note**: This is an MVP (Minimum Viable Product) implementation focused on core functionality. The system is designed to be scalable and extensible for future enhancements.