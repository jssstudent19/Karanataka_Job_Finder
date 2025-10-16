# Karnataka Job Portal - Deployment Guide

## Table of Contents
1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [SSL/HTTPS Setup](#ssl-https-setup)
6. [Monitoring & Logging](#monitoring-logging)
7. [Backup & Recovery](#backup-recovery)
8. [Performance Optimization](#performance-optimization)

---

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB database provisioned
- [ ] OpenAI API key obtained
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] File storage configured
- [ ] Email service configured (if applicable)
- [ ] Monitoring tools set up
- [ ] Backup strategy in place
- [ ] Security review completed
- [ ] Load testing completed
- [ ] Documentation updated

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# Application
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Domain
DOMAIN=https://yourjobportal.com
FRONTEND_URL=https://yourjobportal.com
BACKEND_URL=https://api.yourjobportal.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karnataka_jobs_prod?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_chars
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key-here
OPENAI_MODEL=gpt-3.5-turbo

# File Storage
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt

# Job Scraping
SCRAPING_ENABLED=true
SCRAPER_SCHEDULE_DAILY=0 2 * * *
SCRAPER_SCHEDULE_WEEKLY=0 3 * * 0
SCRAPER_TIMEZONE=Asia/Kolkata
SCRAPER_MAX_CONCURRENT=2
SCRAPER_RATE_LIMIT_DELAY=2000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
REGISTER_RATE_LIMIT_MAX=3

# Security
CORS_ORIGIN=https://yourjobportal.com
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_here

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourjobportal.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=Karnataka Job Portal <noreply@yourjobportal.com>

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, random secrets** (min 32 characters)
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**
5. **Limit environment variable access**

---

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster

2. **Configure Database**
   ```bash
   # Cluster Tier: M10 or higher for production
   # Region: Choose closest to your application server
   # Backup: Enable automated backups
   ```

3. **Create Database User**
   ```bash
   # Username: karnataka_jobs_user
   # Password: Generate strong password
   # Role: readWrite on karnataka_jobs_prod
   ```

4. **Whitelist IP Addresses**
   - Add your application server IPs
   - Or allow access from anywhere (0.0.0.0/0) if using VPN/private network

5. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/karnataka_jobs_prod
   ```

### Database Indexes

Run these commands in MongoDB shell to optimize queries:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

// Jobs collection
db.jobs.createIndex({ status: 1, createdAt: -1 });
db.jobs.createIndex({ location: 1 });
db.jobs.createIndex({ requiredSkills: 1 });
db.jobs.createIndex({ company: 1 });
db.jobs.createIndex({ jobType: 1, workMode: 1 });
db.jobs.createIndex({ "salary.min": 1, "salary.max": 1 });
db.jobs.createIndex({ title: "text", description: "text", company: "text" });

// Applications collection
db.applications.createIndex({ applicant: 1, job: 1 }, { unique: true });
db.applications.createIndex({ applicant: 1, status: 1 });
db.applications.createIndex({ job: 1, status: 1 });
db.applications.createIndex({ status: 1, appliedAt: -1 });

// External Jobs collection
db.externaljobs.createIndex({ externalId: 1, source: 1 }, { unique: true });
db.externaljobs.createIndex({ source: 1, status: 1 });
db.externaljobs.createIndex({ location: 1 });
db.externaljobs.createIndex({ scrapedAt: -1 });
```

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/karnataka-job-portal
sudo chown -R $USER:$USER /var/www/karnataka-job-portal

# Clone repository
cd /var/www/karnataka-job-portal
git clone https://github.com/yourusername/karnataka-job-portal.git .

# Install dependencies
npm ci --production

# Create environment file
nano .env.production

# Create uploads directory
mkdir -p uploads/resumes
chmod 755 uploads
```

#### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'karnataka-jobs-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100,
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
  }]
};
```

#### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd

# Monitor
pm2 monit
```

#### 5. Nginx Configuration

Create `/etc/nginx/sites-available/karnataka-jobs`:

```nginx
server {
    listen 80;
    server_name api.yourjobportal.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourjobportal.com;

    ssl_certificate /etc/letsencrypt/live/api.yourjobportal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourjobportal.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (if serving from backend)
    location /uploads {
        alias /var/www/karnataka-job-portal/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/karnataka-jobs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourjobportal.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p uploads/resumes

EXPOSE 5000

CMD ["node", "src/server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### Deploy with Docker

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### Option 3: Heroku

#### Prepare for Heroku

Create `Procfile`:
```
web: node src/server.js
```

Create `app.json`:
```json
{
  "name": "Karnataka Job Portal",
  "description": "AI-powered job portal for Karnataka",
  "repository": "https://github.com/yourusername/karnataka-job-portal",
  "keywords": ["node", "express", "mongodb", "jobs"],
  "addons": ["mongolab:sandbox"],
  "env": {
    "NODE_ENV": "production",
    "JWT_SECRET": {
      "description": "Secret key for JWT",
      "generator": "secret"
    },
    "OPENAI_API_KEY": {
      "description": "OpenAI API key for resume parsing"
    }
  }
}
```

#### Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create karnataka-job-portal

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set OPENAI_API_KEY=your_openai_key

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main

# Scale
heroku ps:scale web=1

# View logs
heroku logs --tail
```

---

### Option 4: AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create karnataka-jobs-prod

# Deploy
eb deploy

# Open in browser
eb open
```

---

## SSL/HTTPS Setup

### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourjobportal.com

# Auto-renewal (cron)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### CloudFlare (Free SSL)

1. Add domain to CloudFlare
2. Update nameservers
3. Enable SSL/TLS (Full or Full Strict)
4. Enable "Always Use HTTPS"

---

## Monitoring & Logging

### Application Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# CPU/Memory usage
pm2 list

# Application logs
pm2 logs karnataka-jobs-api
```

#### Log Rotation

Create `/etc/logrotate.d/karnataka-jobs`:
```
/var/www/karnataka-job-portal/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Error Tracking (Sentry)

```javascript
// Add to src/app.js
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  
  app.use(Sentry.Handlers.errorHandler());
}
```

### Health Check Endpoint

```javascript
// src/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: await checkDatabase(),
      openai: await checkOpenAI(),
      disk: await checkDiskSpace(),
    }
  };
  
  res.json(health);
});
```

---

## Backup & Recovery

### MongoDB Backups

#### Automated Backups (Cron)

```bash
# Create backup script
nano /usr/local/bin/mongodb-backup.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/karnataka_jobs_prod"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Compress
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" "$BACKUP_DIR/backup_$TIMESTAMP"
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.tar.gz"
```

```bash
# Make executable
chmod +x /usr/local/bin/mongodb-backup.sh

# Add to cron (daily at 3 AM)
crontab -e
# Add: 0 3 * * * /usr/local/bin/mongodb-backup.sh
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backup_20250111_030000.tar.gz

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/karnataka_jobs_prod" backup_20250111_030000/
```

---

## Performance Optimization

### 1. Enable Caching

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache job listings
const cacheKey = `jobs:${page}:${limit}:${filters}`;
const cached = await client.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 2. Database Optimization

- Use indexes on frequently queried fields
- Implement pagination
- Use lean() for read-only queries
- Limit fields with select()

### 3. File Storage

Use cloud storage for uploaded files:

```javascript
// AWS S3
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const uploadToS3 = async (file) => {
  return s3.upload({
    Bucket: process.env.S3_BUCKET,
    Key: file.filename,
    Body: file.buffer
  }).promise();
};
```

### 4. Rate Limiting

Already implemented in the application. Monitor and adjust limits as needed.

### 5. Compression

```javascript
const compression = require('compression');
app.use(compression());
```

---

## Post-Deployment Tasks

1. **Test all endpoints** - Use Postman or automated tests
2. **Monitor application logs** - Check for errors
3. **Set up alerts** - For downtime or errors
4. **Test backup restoration** - Verify backups work
5. **Load testing** - Use tools like Artillery or k6
6. **Security audit** - Run vulnerability scans
7. **Documentation update** - Update with production URLs
8. **Train administrators** - Provide admin documentation

---

## Troubleshooting

### Application won't start
- Check environment variables
- Verify MongoDB connection
- Check port availability
- Review error logs

### High memory usage
- Check for memory leaks
- Optimize database queries
- Increase server resources
- Implement caching

### Slow response times
- Add database indexes
- Enable caching
- Optimize scraping frequency
- Use CDN for static files

---

## Useful Commands

```bash
# PM2
pm2 restart karnataka-jobs-api
pm2 stop karnataka-jobs-api
pm2 delete karnataka-jobs-api
pm2 logs karnataka-jobs-api --lines 100

# Nginx
sudo systemctl restart nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# MongoDB
mongosh "mongodb+srv://cluster.mongodb.net/karnataka_jobs_prod" --username user
db.stats()
db.collection.find().limit(10)

# System
htop
df -h
free -m
```

---

**For additional support, refer to the [README.md](../README.md) and [API Documentation](./API_DOCUMENTATION.md)**