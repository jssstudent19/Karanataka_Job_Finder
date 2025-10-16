/**
 * Test Recommendation Routes
 * Routes for testing the job recommendation system
 */

const express = require('express');
const router = express.Router();
const {
  testWithSampleResume,
  testWithUploadedResume,
  getTestStatus,
  quickTest
} = require('../controllers/testRecommendationController');

// Test status and configuration
router.get('/', getTestStatus);

// Quick test with simple parameters
router.post('/quick', quickTest);

// Test with built-in sample resume
router.post('/sample', testWithSampleResume);

// Test with uploaded resume file
router.post('/upload', testWithUploadedResume);

module.exports = router;