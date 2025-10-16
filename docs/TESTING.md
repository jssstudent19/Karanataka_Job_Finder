# Karnataka Job Portal - Testing Guide

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Test Coverage](#test-coverage)
7. [Manual Testing](#manual-testing)

---

## Testing Strategy

Our testing approach includes:

### 1. **Unit Tests**
- Test individual functions and services in isolation
- Mock external dependencies
- Focus on business logic

### 2. **Integration Tests**
- Test API endpoints end-to-end
- Test database operations
- Verify authentication and authorization

### 3. **Service Tests**
- Test AI resume parsing service
- Test job scraping service
- Test matching algorithms

### 4. **Manual Testing**
- Test user workflows
- Test admin functionality
- Test edge cases

---

## Test Environment Setup

### Install Testing Dependencies

```bash
npm install --save-dev jest supertest mongodb-memory-server
```

### Environment Variables for Testing

Create `.env.test`:

```env
NODE_ENV=test
PORT=5001
MONGODB_URI=mongodb://localhost:27017/karnataka_jobs_test
JWT_SECRET=test_jwt_secret_key
JWT_EXPIRE=1h
OPENAI_API_KEY=sk-test-key-for-testing
SCRAPING_ENABLED=false
```

### Configure Jest

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
```

### Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npm test -- auth.test.js
```

---

## Test Structure

```
tests/
├── setup.js                 # Global test setup
├── helpers/                 # Test utilities
│   ├── testDb.js           # Test database helpers
│   └── mockData.js         # Mock data generators
├── unit/                    # Unit tests
│   ├── services/
│   │   ├── aiService.test.js
│   │   ├── matchingService.test.js
│   │   └── scraperService.test.js
│   └── utils/
│       └── validators.test.js
└── integration/             # Integration tests
    ├── auth.test.js
    ├── jobs.test.js
    ├── applications.test.js
    ├── resume.test.js
    └── admin.test.js
```

---

## Writing Tests

### Test Setup Helper (`tests/setup.js`)

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

### Mock Data Helper (`tests/helpers/mockData.js`)

```javascript
const mockUser = {
  jobseeker: {
    name: 'Test Job Seeker',
    email: 'jobseeker@test.com',
    password: 'password123',
    role: 'jobseeker',
    phone: '9876543210',
    location: 'Bangalore',
    skills: ['JavaScript', 'React', 'Node.js'],
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    permissions: ['manage_jobs', 'manage_users'],
  },
};

const mockJob = {
  title: 'Senior React Developer',
  description: 'Looking for experienced React developer',
  company: 'Test Company',
  location: 'Bangalore, Karnataka',
  jobType: 'full-time',
  workMode: 'hybrid',
  requiredSkills: ['React', 'JavaScript', 'TypeScript'],
  experience: { min: 3, max: 6 },
  salary: { min: 800000, max: 1200000, currency: 'INR', period: 'annual' },
  education: 'bachelors',
  status: 'active',
};

const mockResume = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  experience: [
    {
      company: 'Previous Company',
      position: 'Software Developer',
      startDate: '2020-01',
      endDate: '2023-12',
      description: 'Worked on React applications',
    },
  ],
  education: [
    {
      degree: 'Bachelor of Engineering',
      institution: 'Test University',
      year: '2020',
    },
  ],
  totalExperienceYears: 4,
};

module.exports = { mockUser, mockJob, mockResume };
```

### Example: Authentication Tests (`tests/integration/auth.test.js`)

```javascript
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { mockUser } = require('../helpers/mockData');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new job seeker successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(mockUser.jobseeker.email);
    });

    it('should not register user with existing email', async () => {
      await User.create(mockUser.jobseeker);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.jobseeker.email,
          password: mockUser.jobseeker.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.jobseeker.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker);
      token = res.body.data.token;
    });

    it('should get profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(mockUser.jobseeker.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
```

### Example: Job Tests (`tests/integration/jobs.test.js`)

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { mockUser, mockJob } = require('../helpers/mockData');

describe('Jobs API', () => {
  let adminToken;
  let jobseekerToken;
  let jobId;

  beforeEach(async () => {
    // Create admin and get token
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send(mockUser.admin);
    adminToken = adminRes.body.data.token;

    // Create jobseeker and get token
    const jobseekerRes = await request(app)
      .post('/api/auth/register')
      .send(mockUser.jobseeker);
    jobseekerToken = jobseekerRes.body.data.token;
  });

  describe('POST /api/jobs', () => {
    it('should create job as admin', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.job.title).toBe(mockJob.title);
      jobId = res.body.data.job._id;
    });

    it('should reject job creation by jobseeker', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${jobseekerToken}`)
        .send(mockJob)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/jobs', () => {
    beforeEach(async () => {
      // Create a job
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
    });

    it('should get all jobs without authentication', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs).toHaveLength(1);
    });

    it('should filter jobs by location', async () => {
      const res = await request(app)
        .get('/api/jobs?location=Bangalore')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
    });

    it('should search jobs by title', async () => {
      const res = await request(app)
        .get('/api/jobs?search=React')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
    });
  });
});
```

### Example: AI Service Tests (`tests/unit/services/aiService.test.js`)

```javascript
const { parseResumeWithAI } = require('../../../src/services/aiService');
const openai = require('../../../src/config/openai');

// Mock OpenAI
jest.mock('../../../src/config/openai');

describe('AI Service', () => {
  describe('parseResumeWithAI', () => {
    const mockResumeText = `
      John Doe
      john@example.com | 9876543210
      
      Skills: JavaScript, React, Node.js
      
      Experience:
      Software Developer at Tech Corp (2020-2023)
    `;

    it('should parse resume successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              phone: '9876543210',
              skills: ['JavaScript', 'React', 'Node.js'],
              experience: [{
                company: 'Tech Corp',
                position: 'Software Developer',
                startDate: '2020',
                endDate: '2023',
              }],
            }),
          },
        }],
      };

      openai.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await parseResumeWithAI(mockResumeText);

      expect(result).toHaveProperty('name', 'John Doe');
      expect(result.skills).toContain('JavaScript');
      expect(result.experience).toHaveLength(1);
    });

    it('should handle parsing errors', async () => {
      openai.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(parseResumeWithAI(mockResumeText))
        .rejects.toThrow('Resume parsing failed');
    });
  });
});
```

---

## Test Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

View coverage report in `coverage/lcov-report/index.html`

### Coverage Goals
- **Overall**: 80%+
- **Critical paths**: 90%+
- **Controllers**: 85%+
- **Services**: 90%+
- **Models**: 75%+

---

## Manual Testing

### Using Postman/Thunder Client

1. **Import the API collection** (create Postman collection)
2. **Set environment variables**:
   - `base_url`: http://localhost:5000/api
   - `token`: (will be set after login)

### Test Workflows

#### Job Seeker Flow
1. Register as job seeker
2. Upload resume
3. View parsed resume
4. Search for jobs
5. Get job recommendations
6. Apply for jobs
7. View application status

#### Admin Flow
1. Register as admin
2. Create jobs
3. View applications
4. Update application status
5. Manage users
6. Trigger job scraping

### Testing Checklist

- [ ] User registration and login
- [ ] Profile management
- [ ] Password change
- [ ] Resume upload and parsing
- [ ] Job creation and management
- [ ] Job search and filtering
- [ ] Application submission
- [ ] Application tracking
- [ ] AI job matching
- [ ] Skills gap analysis
- [ ] External job scraping
- [ ] Admin user management
- [ ] Rate limiting
- [ ] Error handling
- [ ] Authentication middleware
- [ ] Authorization checks

---

## CI/CD Testing

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test_secret
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### Common Issues

**MongoDB Connection Issues:**
```javascript
// Increase timeout in jest.config.js
module.exports = {
  testTimeout: 30000,
};
```

**OpenAI API Rate Limits:**
```javascript
// Mock OpenAI in tests
jest.mock('../config/openai');
```

**File Upload Tests:**
```javascript
const path = require('path');
const testFile = path.join(__dirname, 'fixtures', 'sample-resume.pdf');

await request(app)
  .post('/api/resume/upload')
  .attach('resume', testFile);
```

---

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should explain what they test
3. **Test edge cases** - Don't just test the happy path
4. **Mock external services** - Don't make real API calls
5. **Clean up after tests** - Clear database between tests
6. **Use factories** - Create reusable test data generators
7. **Test error handling** - Verify error responses
8. **Keep tests fast** - Optimize database operations
9. **Document test cases** - Explain complex test scenarios
10. **Update tests with code** - Keep tests in sync with implementation

---

## Next Steps

1. Implement full test suite for all endpoints
2. Add load testing with Artillery or k6
3. Set up automated testing in CI/CD
4. Add E2E tests with Playwright
5. Monitor test coverage over time
6. Add performance benchmarking tests

---

**For more information, see the [API Documentation](./API_DOCUMENTATION.md)**