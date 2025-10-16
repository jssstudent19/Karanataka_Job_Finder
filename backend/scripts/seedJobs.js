require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const User = require('../src/models/User');

const sampleJobs = [
  {
    title: 'Full Stack Developer',
    description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
    company: 'Tech Solutions Karnataka',
    location: 'Bangalore, Karnataka',
    jobType: 'full-time',
    workMode: 'hybrid',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
    experience: { min: 2, max: 5 },
    salary: { min: 600000, max: 1200000, currency: 'INR', period: 'annual' },
    education: 'bachelors',
    responsibilities: [
      'Develop and maintain web applications',
      'Collaborate with cross-functional teams',
      'Write clean, maintainable code',
      'Participate in code reviews'
    ],
    requirements: [
      '2+ years of experience in web development',
      'Strong knowledge of JavaScript and React',
      'Experience with REST APIs',
      'Good communication skills'
    ],
    benefits: ['Health insurance', 'Work from home', 'Flexible hours'],
    status: 'active',
    priority: 'high',
    featured: true
  },
  {
    title: 'Senior Frontend Developer',
    description: 'Join our team as a Senior Frontend Developer. Work on cutting-edge projects using React, TypeScript, and modern frontend technologies.',
    company: 'Digital Innovations Pvt Ltd',
    location: 'Mysore, Karnataka',
    jobType: 'full-time',
    workMode: 'remote',
    requiredSkills: ['React', 'TypeScript', 'HTML', 'CSS', 'Redux'],
    experience: { min: 3, max: 7 },
    salary: { min: 800000, max: 1500000, currency: 'INR', period: 'annual' },
    education: 'bachelors',
    responsibilities: [
      'Build responsive web applications',
      'Lead frontend development initiatives',
      'Mentor junior developers',
      'Optimize application performance'
    ],
    requirements: [
      '3+ years of React experience',
      'Strong TypeScript knowledge',
      'Experience with state management',
      'Leadership skills'
    ],
    benefits: ['Remote work', 'Health insurance', 'Learning budget'],
    status: 'active',
    priority: 'high'
  },
  {
    title: 'Backend Developer - Node.js',
    description: 'Looking for a skilled Backend Developer with expertise in Node.js and database management. Join our growing tech team!',
    company: 'StartUp Hub Karnataka',
    location: 'Mangalore, Karnataka',
    jobType: 'full-time',
    workMode: 'onsite',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'AWS'],
    experience: { min: 1, max: 4 },
    salary: { min: 500000, max: 1000000, currency: 'INR', period: 'annual' },
    education: 'bachelors',
    responsibilities: [
      'Design and develop RESTful APIs',
      'Optimize database queries',
      'Implement security best practices',
      'Deploy and maintain applications'
    ],
    requirements: [
      '1+ years Node.js experience',
      'Database design knowledge',
      'Understanding of cloud platforms',
      'Problem-solving skills'
    ],
    benefits: ['Career growth', 'Health insurance', 'Team outings'],
    status: 'active',
    priority: 'medium'
  },
  {
    title: 'UI/UX Designer',
    description: 'Creative UI/UX Designer needed to design beautiful and intuitive user interfaces for web and mobile applications.',
    company: 'Design Studio KA',
    location: 'Hubli, Karnataka',
    jobType: 'full-time',
    workMode: 'hybrid',
    requiredSkills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping'],
    experience: { min: 2, max: 5 },
    salary: { min: 400000, max: 900000, currency: 'INR', period: 'annual' },
    education: 'bachelors',
    responsibilities: [
      'Create wireframes and prototypes',
      'Conduct user research',
      'Design user interfaces',
      'Collaborate with developers'
    ],
    requirements: [
      '2+ years UI/UX experience',
      'Portfolio required',
      'Strong design skills',
      'User-centered design approach'
    ],
    benefits: ['Creative environment', 'Flexible hours', 'Design tools provided'],
    status: 'active',
    priority: 'medium'
  },
  {
    title: 'DevOps Engineer',
    description: 'Experienced DevOps Engineer wanted to manage infrastructure, CI/CD pipelines, and cloud deployments.',
    company: 'Cloud Tech Karnataka',
    location: 'Bangalore, Karnataka',
    jobType: 'full-time',
    workMode: 'remote',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Linux'],
    experience: { min: 3, max: 6 },
    salary: { min: 900000, max: 1600000, currency: 'INR', period: 'annual' },
    education: 'bachelors',
    responsibilities: [
      'Manage cloud infrastructure',
      'Implement CI/CD pipelines',
      'Monitor system performance',
      'Ensure security compliance'
    ],
    requirements: [
      '3+ years DevOps experience',
      'Strong AWS knowledge',
      'Container orchestration skills',
      'Scripting abilities'
    ],
    benefits: ['Remote work', 'Health insurance', 'Certification support'],
    status: 'active',
    priority: 'urgent',
    featured: true
  }
];

async function seedJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user (or create one if needed)
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found. Creating one...');
      admin = new User({
        name: 'System Admin',
        email: 'admin@karnatakajobs.com',
        password: 'admin123',
        role: 'admin',
        phone: '9876543210',
        location: 'Karnataka',
        permissions: ['users', 'jobs', 'applications', 'external_jobs', 'analytics']
      });
      await admin.save();
      console.log('Admin user created');
    }

    // Clear existing sample jobs (optional)
    // await Job.deleteMany({});
    // console.log('Cleared existing jobs');

    // Add postedBy field to each job
    const jobsToInsert = sampleJobs.map(job => ({
      ...job,
      postedBy: admin._id,
      source: 'internal'
    }));

    // Insert sample jobs
    const insertedJobs = await Job.insertMany(jobsToInsert);
    console.log(`✅ Successfully seeded ${insertedJobs.length} jobs!`);

    // Display summary
    console.log('\n📊 Jobs Summary:');
    insertedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company} - ${job.location}`);
    });

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedJobs();
