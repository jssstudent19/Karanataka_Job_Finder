const jobAggregatorService = require('./services/jobAggregatorService');

async function fetchFreshJobs() {
  try {
    console.log('🚀 Starting fresh job fetch with maximum settings...\n');
    console.log('Settings:');
    console.log('  - Location: Karnataka, India');
    console.log('  - Limit per source: 200 jobs');
    console.log('  - Date range: Last 30 days');
    console.log('  - Sources: JSearch, Adzuna, Careerjet');
    console.log('  - Total expected: ~600 jobs\n');
    
    const result = await jobAggregatorService.fetchAndSaveAllJobs({
      location: 'Karnataka,India',
      limitPerSource: 200,
      sources: ['jsearch', 'adzuna', 'careerjet']
    });
    
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                 FETCH COMPLETED                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('Results:');
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  📊 Total jobs saved: ${result.saveResults?.saved || 0}`);
    console.log(`  ⚠️  Duplicates skipped: ${result.saveResults?.duplicates || 0}`);
    console.log(`  ❌ Errors: ${result.saveResults?.errors || 0}\n`);
    
    if (result.aggregationResults?.bySource) {
      console.log('By Source:');
      Object.entries(result.aggregationResults.bySource).forEach(([source, count]) => {
        console.log(`  - ${source}: ${count} jobs`);
      });
    }
    
    console.log('\n✅ Fresh job data is now available in your portal!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fetchFreshJobs();
