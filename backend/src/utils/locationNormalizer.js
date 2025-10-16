/**
 * Location Normalizer
 * Handles common location name variations and normalizes them for better search results
 */

// All 31 districts of Karnataka with their variations
const karnatakaDistricts = [
  // Major cities
  'Bangalore', 'Bengaluru', 'Bangalore Rural', 'Bangalore Urban',
  'Mysore', 'Mysuru',
  'Mangalore', 'Mangaluru', 'Dakshina Kannada',
  'Hubli', 'Hubballi', 'Dharwad', 'Hubli-Dharwad',
  'Belgaum', 'Belagavi',
  'Gulbarga', 'Kalaburagi',
  'Bellary', 'Ballari',
  'Bijapur', 'Vijayapura',
  'Shimoga', 'Shivamogga',
  'Tumkur', 'Tumakuru',
  
  // Other districts
  'Bagalkot', 'Bagalkote',
  'Bidar',
  'Chamarajanagar', 'Chamarajanagara',
  'Chikkaballapur', 'Chikballapur',
  'Chikkamagaluru', 'Chikmagalur',
  'Chitradurga',
  'Davangere', 'Davanagere',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kodagu', 'Coorg',
  'Kolar',
  'Koppal',
  'Mandya',
  'Raichur',
  'Ramanagara', 'Ramanagaram',
  'Udupi',
  'Uttara Kannada', 'Karwar',
  'Yadgir', 'Yadgiri',
  'Vijayapura',
  'Vijayanagara'
];

// Common city name variations in Karnataka
const cityVariations = {
  'bangalore': ['bengaluru', 'bangaluru', 'banglore', 'blr'],
  'bengaluru': ['bangalore', 'bangaluru', 'banglore', 'blr'],
  'mysore': ['mysuru', 'mysur'],
  'mysuru': ['mysore', 'mysur'],
  'mangalore': ['mangaluru', 'mangalur'],
  'mangaluru': ['mangalore', 'mangalur'],
  'hubli': ['hubballi', 'hubali'],
  'hubballi': ['hubli', 'hubali'],
  'belgaum': ['belagavi', 'belgavi'],
  'belagavi': ['belgaum', 'belgavi'],
  'gulbarga': ['kalaburagi', 'kalburgi'],
  'kalaburagi': ['gulbarga', 'kalburgi'],
  'bellary': ['ballari', 'belary'],
  'ballari': ['bellary', 'belary'],
  'bijapur': ['vijayapura', 'vijaypura'],
  'vijayapura': ['bijapur', 'vijaypura'],
  'shimoga': ['shivamogga', 'shivamoga'],
  'shivamogga': ['shimoga', 'shivamoga'],
  'tumkur': ['tumakuru', 'tumkuru'],
  'tumakuru': ['tumkur', 'tumkuru']
};

/**
 * Normalize location string for better matching
 * @param {string} location - Raw location string
 * @returns {object} - Normalized location data
 */
function normalizeLocation(location) {
  if (!location) return { original: '', normalized: '', variations: [] };

  // Clean up location string
  let normalized = location
    .toLowerCase()
    .trim()
    // Remove country suffix
    .replace(/,\s*(india|in|ind)$/i, '')
    // Remove state suffix
    .replace(/,\s*(karnataka|ka|kar)$/i, '')
    // Remove common words
    .replace(/\b(city|district|taluk|town)\b/gi, '')
    .trim();

  // Extract main city name (first part before comma)
  const mainCity = normalized.split(',')[0].trim();

  // Get all variations for this city
  const variations = cityVariations[mainCity] || [];

  return {
    original: location,
    normalized: mainCity,
    variations: variations,
    searchTerms: [mainCity, ...variations]
  };
}

/**
 * Generate regex pattern for location search including all variations
 * @param {string} location - Location to search for
 * @returns {string} - Regex pattern
 */
function generateLocationSearchPattern(location) {
  const { searchTerms } = normalizeLocation(location);
  
  // Create regex pattern that matches any of the variations
  // Use word boundaries to avoid partial matches
  return searchTerms.map(term => `\\b${term}\\b`).join('|');
}

/**
 * Check if two locations are similar (accounting for variations)
 * @param {string} loc1 - First location
 * @param {string} loc2 - Second location
 * @returns {boolean} - True if locations are similar
 */
function areLocationsSimilar(loc1, loc2) {
  const norm1 = normalizeLocation(loc1);
  const norm2 = normalizeLocation(loc2);

  // Check if normalized names match
  if (norm1.normalized === norm2.normalized) return true;

  // Check if either location's variations include the other
  if (norm1.variations.includes(norm2.normalized)) return true;
  if (norm2.variations.includes(norm1.normalized)) return true;

  return false;
}

/**
 * Check if a location is in Karnataka
 * @param {string} location - Location to check
 * @returns {boolean} - True if location is in Karnataka
 */
function isKarnatakaLocation(location) {
  if (!location) return false;
  
  const normalized = location.toLowerCase().trim();
  
  // Check if location matches any Karnataka district (case-insensitive)
  return karnatakaDistricts.some(district => 
    normalized.includes(district.toLowerCase()) || 
    district.toLowerCase().includes(normalized)
  );
}

/**
 * Filter locations to only include Karnataka districts
 * @param {Array<string>} locations - Array of location strings
 * @returns {Array<string>} - Filtered array containing only Karnataka locations
 */
function filterKarnatakaLocations(locations) {
  if (!Array.isArray(locations)) return [];
  
  return locations.filter(location => isKarnatakaLocation(location));
}

module.exports = {
  normalizeLocation,
  generateLocationSearchPattern,
  areLocationsSimilar,
  isKarnatakaLocation,
  filterKarnatakaLocations,
  cityVariations,
  karnatakaDistricts
};
