// Test the regex pattern logic

function testRegexPattern() {
  console.log('=== TESTING REGEX PATTERNS ===\n');

  // Test 1: full-time pattern
  const jobType1 = 'full-time';
  const escapedType1 = jobType1.replace(/[-\s]/g, '[-\\s]?');
  console.log('Input: "full-time"');
  console.log('Pattern:', escapedType1);
  console.log('Regex:', new RegExp(escapedType1, 'i'));
  
  const testValues1 = ['full-time', 'Full-time', 'FULL-TIME', 'fulltime', 'Fulltime', 'full time', 'Full Time'];
  console.log('Test matches:');
  testValues1.forEach(val => {
    const matches = new RegExp(escapedType1, 'i').test(val);
    console.log(`  "${val}": ${matches ? '✓' : '✗'}`);
  });

  console.log('\n---\n');

  // Test 2: onsite pattern
  const workMode1 = 'onsite';
  const escapedMode1 = workMode1.replace(/[-\s]/g, '[-\\s]?');
  console.log('Input: "onsite"');
  console.log('Pattern:', escapedMode1);
  console.log('Regex:', new RegExp(escapedMode1, 'i'));
  
  const testValues2 = ['onsite', 'Onsite', 'ONSITE', 'on-site', 'On-site', 'ON-SITE', 'on site', 'On site'];
  console.log('Test matches:');
  testValues2.forEach(val => {
    const matches = new RegExp(escapedMode1, 'i').test(val);
    console.log(`  "${val}": ${matches ? '✓' : '✗'}`);
  });

  console.log('\n---\n');

  // Test 3: remote pattern
  const workMode2 = 'remote';
  const escapedMode2 = workMode2.replace(/[-\s]/g, '[-\\s]?');
  console.log('Input: "remote"');
  console.log('Pattern:', escapedMode2);
  console.log('Regex:', new RegExp(escapedMode2, 'i'));
  
  const testValues3 = ['remote', 'Remote', 'REMOTE', 'Remote Work', 'remote work'];
  console.log('Test matches:');
  testValues3.forEach(val => {
    const matches = new RegExp(escapedMode2, 'i').test(val);
    console.log(`  "${val}": ${matches ? '✓' : '✗'}`);
  });
}

testRegexPattern();
