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
    permissions: ['manage_jobs', 'manage_users', 'manage_applications'],
  },
  jobseeker2: {
    name: 'Another Job Seeker',
    email: 'jobseeker2@test.com',
    password: 'password123',
    role: 'jobseeker',
    phone: '9876543211',
    location: 'Mysore',
    skills: ['Python', 'Django', 'PostgreSQL'],
  },
};

const mockJob = {
  title: 'Senior React Developer',
  description: 'Looking for experienced React developer with strong JavaScript fundamentals',
  company: 'Test Company',
  location: 'Bangalore, Karnataka',
  jobType: 'full-time',
  workMode: 'hybrid',
  requiredSkills: ['React', 'JavaScript', 'TypeScript'],
  experience: { min: 3, max: 6 },
  salary: { 
    min: 800000, 
    max: 1200000, 
    currency: 'INR', 
    period: 'annual' 
  },
  education: 'bachelors',
  status: 'active',
  responsibilities: [
    'Build reusable React components',
    'Optimize application performance',
    'Collaborate with backend team',
  ],
  requirements: [
    '3+ years React experience',
    'Strong JavaScript fundamentals',
    'Experience with TypeScript',
  ],
};

const mockJob2 = {
  title: 'Backend Node.js Developer',
  description: 'Looking for Node.js developer with MongoDB experience',
  company: 'Tech Corp',
  location: 'Mysore, Karnataka',
  jobType: 'full-time',
  workMode: 'remote',
  requiredSkills: ['Node.js', 'MongoDB', 'Express'],
  experience: { min: 2, max: 5 },
  salary: { 
    min: 600000, 
    max: 1000000, 
    currency: 'INR', 
    period: 'annual' 
  },
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
      description: 'Worked on React applications and REST APIs',
      responsibilities: [
        'Built user interfaces with React',
        'Developed REST APIs with Node.js',
      ],
    },
  ],
  education: [
    {
      degree: 'Bachelor of Engineering',
      institution: 'Test University',
      fieldOfStudy: 'Computer Science',
      year: '2020',
    },
  ],
  totalExperienceYears: 4,
  currentRole: 'Software Developer',
  summary: 'Experienced software developer with focus on web technologies',
};

const mockApplication = {
  coverLetter: 'I am excited to apply for this position. I have strong experience with React and JavaScript...',
};

const mockExternalJob = {
  title: 'Full Stack Developer',
  company: 'External Company',
  location: 'Bangalore, Karnataka',
  description: 'Full stack position with React and Node.js',
  source: 'indeed',
  externalId: 'ext-job-123',
  externalUrl: 'https://indeed.com/job/123',
  salaryText: '8-12 LPA',
  skills: ['React', 'Node.js', 'MongoDB'],
  status: 'active',
};

module.exports = {
  mockUser,
  mockJob,
  mockJob2,
  mockResume,
  mockApplication,
  mockExternalJob,
};
