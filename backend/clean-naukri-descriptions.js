require('dotenv').config();
const mongoose = require('mongoose');
const ExternalJob = require('./src/models/ExternalJob');

function stripHtmlTags(html) {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&rsquo;/g, "'")
             .replace(/&lsquo;/g, "'")
             .replace(/&rdquo;/g, '"')
             .replace(/&ldquo;/g, '"');
  
  // Clean up multiple spaces and newlines
  text = text.replace(/\s+/g, ' ')
             .replace(/\n\s*\n/g, '\n')
             .trim();
  
  return text;
}

async function cleanDescriptions() {
  console.log('Cleaning Naukri job descriptions...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all Naukri jobs
    const naukriJobs = await ExternalJob.find({ source: 'apify-naukri' });
    console.log(`Found ${naukriJobs.length} Naukri jobs to clean\n`);

    let cleaned = 0;
    let errors = 0;

    for (const job of naukriJobs) {
      try {
        // Check if description has HTML tags
        if (job.description && job.description.includes('<')) {
          const cleanDescription = stripHtmlTags(job.description);
          
          // Trim to 10000 chars
          const finalDescription = cleanDescription.length > 10000 
            ? cleanDescription.substring(0, 10000) 
            : cleanDescription;
          
          await ExternalJob.updateOne(
            { _id: job._id },
            { $set: { description: finalDescription } }
          );
          
          cleaned++;
          if (cleaned <= 3) {
            console.log(`✅ Cleaned: ${job.title}`);
            console.log(`   Before length: ${job.description.length} chars`);
            console.log(`   After length: ${finalDescription.length} chars\n`);
          }
        }
      } catch (error) {
        console.error(`❌ Error cleaning job ${job.title}:`, error.message);
        errors++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total Naukri jobs: ${naukriJobs.length}`);
    console.log(`Cleaned descriptions: ${cleaned}`);
    console.log(`Errors: ${errors}`);
    console.log(`Already clean: ${naukriJobs.length - cleaned - errors}\n`);

    console.log('✅ Done! Descriptions are now clean and readable.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit();
  }
}

cleanDescriptions();
