const { normalizeLocation, generateLocationSearchPattern, areLocationsSimilar } = require('./src/utils/locationNormalizer');

console.log('=== Location Normalizer Tests ===\n');

// Test 1: Bangalore variations
console.log('Test 1: Bangalore variations');
const bangalore1 = normalizeLocation('Bangalore, India');
const bangalore2 = normalizeLocation('Bengaluru, Karnataka');
const bangalore3 = normalizeLocation('Banglore, IN');
console.log('Bangalore, India:', bangalore1);
console.log('Bengaluru, Karnataka:', bangalore2);
console.log('Banglore, IN:', bangalore3);
console.log('Are similar?', areLocationsSimilar('Bangalore', 'Bengaluru'));
console.log('Search pattern:', generateLocationSearchPattern('Bangalore'));
console.log('');

// Test 2: Mysore variations
console.log('Test 2: Mysore variations');
const mysore1 = normalizeLocation('Mysore');
const mysore2 = normalizeLocation('Mysuru, Karnataka');
console.log('Mysore:', mysore1);
console.log('Mysuru:', mysore2);
console.log('Are similar?', areLocationsSimilar('Mysore', 'Mysuru'));
console.log('Search pattern:', generateLocationSearchPattern('Mysore'));
console.log('');

// Test 3: Pattern matching
console.log('Test 3: Testing regex patterns');
const testLocations = [
  'Bangalore, Karnataka, India',
  'Bengaluru, IN',
  'Banglore City',
  'BLR',
  'Mysore, Karnataka',
  'Mysuru District',
  'Delhi, India',
  'Mumbai'
];

const bangalorePattern = new RegExp(generateLocationSearchPattern('Bangalore'), 'i');
const mysorePattern = new RegExp(generateLocationSearchPattern('Mysore'), 'i');

console.log('Locations matching "Bangalore":');
testLocations.forEach(loc => {
  if (bangalorePattern.test(loc)) {
    console.log('  ✓', loc);
  }
});

console.log('\nLocations matching "Mysore":');
testLocations.forEach(loc => {
  if (mysorePattern.test(loc)) {
    console.log('  ✓', loc);
  }
});

console.log('\n=== Tests Complete ===');
