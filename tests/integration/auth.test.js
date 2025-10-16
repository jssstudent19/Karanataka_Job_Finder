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
      expect(res.body.data.user.role).toBe('jobseeker');
    });

    it('should register a new admin successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.admin)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user).toHaveProperty('permissions');
    });

    it('should not register user with existing email', async () => {
      // Create user first
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

    it('should validate email format', async () => {
      const invalidUser = { ...mockUser.jobseeker, email: 'invalid-email' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate password minimum length', async () => {
      const weakPasswordUser = { ...mockUser.jobseeker, password: '12345' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
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
      expect(res.body.data.user.email).toBe(mockUser.jobseeker.email);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: mockUser.jobseeker.password,
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.jobseeker.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should not login inactive user', async () => {
      // Deactivate user
      await User.findOneAndUpdate(
        { email: mockUser.jobseeker.email },
        { isActive: false }
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.jobseeker.email,
          password: mockUser.jobseeker.password,
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

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker);
      token = res.body.data.token;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '9999999999',
        skills: ['JavaScript', 'TypeScript', 'React', 'Vue'],
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updateData.name);
      expect(res.body.data.user.skills).toEqual(updateData.skills);
    });

    it('should not update email through profile', async () => {
      const updateData = {
        email: 'newemail@test.com',
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      // Email should remain unchanged
      expect(res.body.data.user.email).toBe(mockUser.jobseeker.email);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser.jobseeker);
      token = res.body.data.token;
    });

    it('should change password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: mockUser.jobseeker.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Try logging in with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.jobseeker.email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should validate new password length', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: mockUser.jobseeker.password,
          newPassword: '123',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
