const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ExternalJob = require('./src/models/ExternalJob');

// HTML cleaning function with formatting preservation
function cleanText(text) {
  if (!text) return '';
  
  return text
    // Remove script and style tags completely
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    // Convert structural HTML to newlines and formatting
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br[^>]*\/?>/gi, '\n')
    .replace(/<br>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    // Convert list items to bullet points
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul[^>]*>/gi, '\n')
    .replace(/<\/?ol[^>]*>/gi, '\n')
    // Convert strong/bold to text (keep the text, remove tags)
    .replace(/<\/?strong[^>]*>/gi, '')
    .replace(/<\/?b[^>]*>/gi, '')
    .replace(/<\/?em[^>]*>/gi, '')
    .replace(/<\/?i[^>]*>/gi, '')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    // Clean up whitespace while preserving intentional breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')  // Multiple spaces to single space
    .replace(/\n +/g, '\n')  // Remove leading spaces on lines
    .replace(/ +\n/g, '\n')  // Remove trailing spaces on lines
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim()
    .substring(0, 10000);  // Limit to 10k chars
}

async function cleanExistingJobs() {
  try {
    console.log('🔍 Finding jobs with HTML in descriptions...\n');
    
    // Find jobs that likely contain HTML (contain < or >)
    const jobs = await ExternalJob.find({
      description: { $regex: /<[^>]+>/, $options: 'i' }
    });

    console.log(`✅ Found ${jobs.length} jobs with HTML tags\n`);

    if (jobs.length === 0) {
      console.log('No jobs to clean!');
      process.exit(0);
    }

    let cleaned = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        const originalLength = job.description.length;
        const cleanedDescription = cleanText(job.description);
        const newLength = cleanedDescription.length;

        // Only update if the description actually changed
        if (cleanedDescription !== job.description) {
          job.description = cleanedDescription;
          
          // Also clean requirements and responsibilities if they contain HTML
          if (job.requirements && job.requirements.length > 0) {
            job.requirements = job.requirements.map(req => cleanText(req));
          }
          
          if (job.responsibilities && job.responsibilities.length > 0) {
            job.responsibilities = job.responsibilities.map(resp => cleanText(resp));
          }

          await job.save();
          cleaned++;
          
          console.log(`✅ Cleaned: ${job.title} (${job.company})`);
          console.log(`   Description: ${originalLength} → ${newLength} chars`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error cleaning job ${job._id}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total jobs found: ${jobs.length}`);
    console.log(`   Successfully cleaned: ${cleaned}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✅ Job cleaning completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the cleaning
cleanExistingJobs();
