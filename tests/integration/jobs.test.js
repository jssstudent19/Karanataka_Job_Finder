const request = require('supertest');
const app = require('../../src/app');
const { mockUser, mockJob, mockJob2 } = require('../helpers/mockData');

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
      expect(res.body.data.job.company).toBe(mockJob.company);
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

    it('should reject job creation without authentication', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send(mockJob)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidJob = { title: 'Test Job' };
      
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidJob)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/jobs', () => {
    beforeEach(async () => {
      // Create multiple jobs
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
      
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob2);
    });

    it('should get all jobs without authentication', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs).toHaveLength(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter jobs by location', async () => {
      const res = await request(app)
        .get('/api/jobs?location=Bangalore')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.data.jobs[0].location).toContain('Bangalore');
    });

    it('should search jobs by title', async () => {
      const res = await request(app)
        .get('/api/jobs?search=React')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.data.jobs[0].title).toContain('React');
    });

    it('should filter jobs by skills', async () => {
      const res = await request(app)
        .get('/api/jobs?skills=React,JavaScript')
        .expect(200);

      expect(res.body.data.jobs.length).toBeGreaterThan(0);
    });

    it('should filter jobs by job type', async () => {
      const res = await request(app)
        .get('/api/jobs?jobType=full-time')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(2);
    });

    it('should filter jobs by work mode', async () => {
      const res = await request(app)
        .get('/api/jobs?workMode=remote')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.data.jobs[0].workMode).toBe('remote');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/jobs?page=1&limit=1')
        .expect(200);

      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.data.pagination.totalJobs).toBe(2);
      expect(res.body.data.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/jobs/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
      jobId = res.body.data.job._id;
    });

    it('should get job by id', async () => {
      const res = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.job._id).toBe(jobId);
      expect(res.body.data.job.title).toBe(mockJob.title);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should increment view count', async () => {
      // First view
      await request(app).get(`/api/jobs/${jobId}`);
      
      // Second view
      const res = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(200);

      expect(res.body.data.job.viewCount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/jobs/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
      jobId = res.body.data.job._id;
    });

    it('should update job as admin', async () => {
      const updateData = {
        title: 'Updated Senior React Developer',
        status: 'paused',
      };

      const res = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.job.title).toBe(updateData.title);
      expect(res.body.data.job.status).toBe(updateData.status);
    });

    it('should reject job update by jobseeker', async () => {
      const res = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${jobseekerToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
      jobId = res.body.data.job._id;
    });

    it('should delete job as admin', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify job is deleted
      const getRes = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(404);

      expect(getRes.body.success).toBe(false);
    });

    it('should reject job deletion by jobseeker', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${jobseekerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/jobs/admin/my-jobs', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
    });

    it('should get admin jobs', async () => {
      const res = await request(app)
        .get('/api/jobs/admin/my-jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs).toHaveLength(1);
    });

    it('should reject jobseeker access', async () => {
      const res = await request(app)
        .get('/api/jobs/admin/my-jobs')
        .set('Authorization', `Bearer ${jobseekerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/jobs/admin/stats', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockJob);
    });

    it('should get job statistics for admin', async () => {
      const res = await request(app)
        .get('/api/jobs/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobStats).toBeDefined();
      expect(res.body.data.applicationStats).toBeDefined();
    });

    it('should reject jobseeker access', async () => {
      const res = await request(app)
        .get('/api/jobs/admin/stats')
        .set('Authorization', `Bearer ${jobseekerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
