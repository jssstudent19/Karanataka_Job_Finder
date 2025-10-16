/**
 * ONE-TIME APIFY RUN SCRIPT
 * This will trigger the LinkedIn scraper exactly once and save results to database
 */

require('dotenv').config();
const { ApifyClient } = require('apify-client');
const mongoose = require('mongoose');
const ExternalJob = require('./backend/src/models/ExternalJob');

async function runApifyOnce() {
  console.log('🚀 ONE-TIME INDEED JOB SCRAPER');
  console.log('⚠️  This will get 10 Indeed jobs (cost: ~$0.05)');
  console.log('');

  // Connect to database
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

  try {
    // Input for Indeed scraper based on the exact documentation format
    const input = {
      "country": "IN",  // India country code
      "location": "Karnataka",
      "maxConcurrency": 5,
      "maxItems": 10,
      "position": "Software Engineer javascript react node.js",
      "saveOnlyUniqueItems": true
    };

    console.log('📝 Search params:', input);
    console.log('🎬 Starting Indeed scraper...');
    console.log('⏳ This will take 2-5 minutes...');

    // Start the Indeed actor
    const run = await client.actor('misceres/indeed-scraper').call(input);
    console.log(`✅ Actor started! Run ID: ${run.id}`);

    // Wait for completion (with timeout)
    console.log('⏳ Waiting for completion...');
    const completedRun = await waitForCompletion(client, run.id, 300000); // 5 minutes

    if (completedRun.status === 'SUCCEEDED') {
      console.log('🎉 Actor completed successfully!');
      
      // Get the results
      const { items } = await client.run(run.id).dataset().listItems();
      console.log(`📊 Retrieved ${items.length} jobs`);

      if (items.length > 0) {
        console.log('\n💾 Saving jobs to database...');
        
        let saved = 0;
        let errors = 0;

        for (const job of items) {
          try {
            const normalizedJob = {
              source: 'apify-indeed',
              externalId: `apify-indeed-${job.id || Date.now() + Math.random()}`,
              title: job.positionName || job.title || 'Unknown Position',
              company: job.company || 'Unknown Company',
              location: job.location || 'Karnataka, India',
              description: job.description || 'No description',
              externalUrl: job.url || job.link || '',
              postedDate: job.postedAt ? new Date(job.postedAt) : new Date(),
              jobType: mapJobType(job.jobType) || 'Full-time',
              workMode: extractWorkMode(job),
              experienceLevel: mapExperienceLevel(job.jobType),
              status: 'active',
              
              // Indeed specific data
              indeed: {
                jobId: job.id,
                salary: job.salary,
                rating: job.rating,
                reviewsCount: job.reviewsCount,
                urgent: job.urgent,
                sponsored: job.sponsored
              },
              
              lastSyncedAt: new Date()
            };

            // Check if job already exists
            const existing = await ExternalJob.findOne({
              externalId: normalizedJob.externalId
            });

            if (!existing) {
              await ExternalJob.create(normalizedJob);
              saved++;
              console.log(`✅ Saved: ${normalizedJob.title} at ${normalizedJob.company}`);
            } else {
              console.log(`⚠️  Exists: ${normalizedJob.title} at ${normalizedJob.company}`);
            }
          } catch (error) {
            console.error(`❌ Error saving job:`, error.message);
            errors++;
          }
        }

        console.log(`\n🎉 COMPLETE!`);
        console.log(`✅ Saved: ${saved} new jobs`);
        console.log(`⚠️  Errors: ${errors}`);
        console.log(`💰 Estimated cost: $${(run.usage?.COMPUTE || 0).toFixed(3)}`);
        
        // Show sample jobs
        console.log('\n📋 Sample jobs saved:');
        const sampleJobs = await ExternalJob.find({ source: 'apify-linkedin' }).limit(3);
        sampleJobs.forEach((job, i) => {
          console.log(`${i+1}. ${job.title} at ${job.company} (${job.location})`);
        });

      } else {
        console.log('❌ No jobs retrieved');
      }

    } else {
      console.error('❌ Actor run failed:', completedRun.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
    console.log('✅ One-time run complete!');
  }
}

// Helper functions
async function waitForCompletion(client, runId, timeout = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const run = await client.run(runId).get();
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏳ Status: ${run.status} (${elapsed}s elapsed)`);
    
    if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
      return run;
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
  }
  
  throw new Error('Actor run timeout');
}

function extractWorkMode(job) {
  const text = `${job.title || ''} ${job.descriptionText || ''}`.toLowerCase();
  if (text.includes('remote')) return 'Remote';
  if (text.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function mapExperienceLevel(jobType) {
  if (!jobType) return 'unknown';
  const jobTypeLower = Array.isArray(jobType) ? jobType.join(' ').toLowerCase() : jobType.toLowerCase();
  if (jobTypeLower.includes('entry') || jobTypeLower.includes('intern')) return 'entry';
  if (jobTypeLower.includes('junior')) return 'junior';
  if (jobTypeLower.includes('mid')) return 'mid';
  if (jobTypeLower.includes('senior')) return 'senior';
  if (jobTypeLower.includes('lead') || jobTypeLower.includes('manager')) return 'lead';
  if (jobTypeLower.includes('director') || jobTypeLower.includes('executive')) return 'executive';
  return 'mid';
}

function mapJobType(jobType) {
  if (!jobType) return 'Full-time';
  const typeArray = Array.isArray(jobType) ? jobType : [jobType];
  const types = typeArray.map(t => t.toLowerCase());
  
  if (types.some(t => t.includes('full'))) return 'Full-time';
  if (types.some(t => t.includes('part'))) return 'Part-time';
  if (types.some(t => t.includes('contract'))) return 'Contract';
  if (types.some(t => t.includes('temporary'))) return 'Temporary';
  if (types.some(t => t.includes('intern'))) return 'Internship';
  
  return 'Full-time';
}

// Run it!
runApifyOnce();