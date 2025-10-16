# Karnataka Job Portal

## About

The Karnataka Job Portal is a comprehensive web application designed to connect job seekers with employment opportunities specifically in Karnataka, India. This AI-powered platform provides intelligent job matching, resume parsing, and streamlined application processes.

### Key Features

- **AI-Powered Resume Parsing**: Automatically extract and structure resume data using advanced AI models
- **Smart Job Matching**: Intelligent job recommendations based on skills and experience
- **Real-time Job Aggregation**: Automated job scraping from popular job portals (LinkedIn, Indeed, Naukri)
- **User-Friendly Interface**: Modern React-based frontend with responsive design
- **Role-Based Access**: Separate interfaces for job seekers and administrators
- **Application Tracking**: Complete application lifecycle management
- **Advanced Search & Filters**: Comprehensive job search capabilities
- **Secure Authentication**: JWT-based authentication with role-based access control

## Installation Guide

### Prerequisites

- **Node.js** (version 16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**
- **OpenAI API Key** (for AI resume parsing)
- **Google Gemini API Key** (optional, for enhanced AI features)

### Step 1: Clone the Repository

```bash
git clone https://github.com/jssstudent19/Karanataka_Job_Finder.git
cd Karanataka_Job_Finder
```

### Step 2: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`**
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
   GOOGLE_AI_API_KEY=your_google_gemini_api_key_here
   AI_MODEL=gpt-3.5-turbo
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   
   # Apify Configuration (for job scraping)
   APIFY_API_TOKEN=your_apify_token_here
   ```

5. **Create required directories**
   ```bash
   mkdir uploads logs
   ```

6. **Start the backend server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The backend server will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

The frontend application will run on `http://localhost:5173`

### Step 4: Database Setup

1. **Ensure MongoDB is running**
   - For local MongoDB: Start the MongoDB service
   - For MongoDB Atlas: Use the connection string in your `.env` file

2. **The application will automatically create the required collections**

### Step 5: Create Admin User (Optional)

```bash
cd backend
node create-admin.js
```

### Step 6: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api

## Tools Used

### Backend Technologies

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Multer**: File upload handling
- **OpenAI API**: AI-powered resume parsing
- **Google Gemini AI**: Enhanced AI capabilities
- **Puppeteer**: Web scraping
- **Apify**: Job scraping service
- **Axios**: HTTP client
- **Cors**: Cross-origin resource sharing
- **Helmet**: Security middleware
- **Morgan**: Request logging
- **Dotenv**: Environment variables
- **Node-cron**: Scheduled tasks

### Frontend Technologies

- **React**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: API communication
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Dropzone**: File upload component
- **React Query**: Data fetching and caching
- **Date-fns**: Date utility library

### Development Tools

- **Jest**: Testing framework
- **Supertest**: API testing
- **MongoDB Memory Server**: In-memory database for testing
- **Nodemon**: Development server auto-restart
- **ESLint**: Code linting
- **Prettier**: Code formatting

### External Services

- **OpenAI GPT**: Resume parsing and content analysis
- **Google Gemini**: Advanced AI processing
- **Apify**: Web scraping platform
- **MongoDB Atlas**: Cloud database (optional)

## Project Structure

```
Karnataka_Job_Portal/
├── backend/                          # Backend API server
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.js          # MongoDB connection
│   │   │   ├── logger.js            # Winston logger setup
│   │   │   └── multer.js            # File upload configuration
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── jobController.js     # Job management
│   │   │   ├── applicationController.js # Application handling
│   │   │   └── resumeController.js  # Resume processing
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js              # Authentication middleware
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── notFound.js          # 404 handler
│   │   ├── models/                  # Database schemas
│   │   │   ├── User.js              # User model
│   │   │   ├── Job.js               # Job model
│   │   │   ├── Application.js       # Application model
│   │   │   ├── ParsedResume.js      # Resume data model
│   │   │   └── ExternalJob.js       # Scraped jobs model
│   │   ├── routes/                  # API endpoints
│   │   │   ├── auth.js              # Authentication routes
│   │   │   ├── jobs.js              # Job routes
│   │   │   ├── applications.js      # Application routes
│   │   │   ├── resume.js            # Resume routes
│   │   │   └── user.js              # User management routes
│   │   ├── services/                # Business logic
│   │   │   ├── resumeParser.js      # AI resume parsing
│   │   │   ├── jobScraper.js        # Web scraping logic
│   │   │   └── jobScraperManager.js # Scraping orchestration
│   │   ├── utils/                   # Utility functions
│   │   │   └── AppError.js          # Error handling utility
│   │   └── index.js                 # Main server file
│   ├── services/                    # External service integrations
│   │   ├── apifyLinkedInService.js  # LinkedIn scraping
│   │   ├── apifyIndeedService.js    # Indeed scraping
│   │   ├── apifyNaukriService.js    # Naukri scraping
│   │   ├── geminiJobSearchService.js # AI job search
│   │   └── jobRecommendationService.js # Job matching
│   ├── scripts/                     # Utility scripts
│   │   └── seedJobs.js              # Database seeding
│   ├── package.json                 # Backend dependencies
│   └── .env.example                 # Environment variables template
│
├── frontend/                        # React frontend application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout.jsx           # Main layout component
│   │   │   ├── AutocompleteInput.jsx # Search input component
│   │   │   └── admin/               # Admin-specific components
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Jobs.jsx             # Job listings
│   │   │   ├── JobDetails.jsx       # Job detail view
│   │   │   ├── Login.jsx            # User login
│   │   │   ├── Register.jsx         # User registration
│   │   │   ├── Profile.jsx          # User profile
│   │   │   ├── UploadResume.jsx     # Resume upload
│   │   │   ├── MyApplications.jsx   # Application tracking
│   │   │   └── admin/               # Admin pages
│   │   ├── services/                # API communication
│   │   │   ├── api.js               # Axios configuration
│   │   │   └── geminiService.ts     # AI service integration
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── useDebounce.js       # Debounce hook
│   │   ├── utils/                   # Utility functions
│   │   │   └── pdfParser.ts         # PDF parsing utilities
│   │   ├── constants/               # Application constants
│   │   │   └── cities.ts            # City data
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── jobRecommendation.ts # Job recommendation types
│   │   ├── App.jsx                  # Main App component
│   │   └── main.jsx                 # Application entry point
│   ├── public/                      # Static assets
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # TailwindCSS configuration
│   └── postcss.config.js           # PostCSS configuration
│
├── docs/                            # Documentation
│   ├── API_DOCUMENTATION.md        # API reference
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── TESTING.md                  # Testing documentation
│
├── scripts/                         # Project-wide scripts
│   ├── start-all.ps1               # Start all services (Windows)
│   └── stop-all.ps1                # Stop all services (Windows)
│
├── tests/                           # Test files
│   ├── integration/                # Integration tests
│   ├── helpers/                    # Test utilities
│   └── setup.js                   # Test configuration
│
├── .gitignore                      # Git ignore rules
├── package.json                    # Root package configuration
├── README.md                       # This file
└── jest.config.js                  # Jest test configuration
```

### Key Directories Explained

- **`backend/src/`**: Core backend application code
- **`backend/services/`**: External service integrations and business logic
- **`frontend/src/`**: React application source code
- **`docs/`**: Comprehensive project documentation
- **`tests/`**: Test suites and testing utilities
- **`scripts/`**: Automation and utility scripts

---

## Getting Started

1. Follow the installation guide above
2. Start both backend and frontend servers
3. Access the application at `http://localhost:5173`
4. Create an admin account using the provided script
5. Begin exploring the job portal features

For detailed API documentation and deployment instructions, check the `/docs` directory.