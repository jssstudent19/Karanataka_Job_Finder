/**
 * Job Recommendation Routes
 * Main routes for AI-powered job recommendations
 */

const express = require('express');
const router = express.Router();
const {
  analyzeJobRecommendations,
  healthCheck
} = require('../controllers/jobRecommendationController');

// Health check endpoint
router.get('/health', healthCheck);

// Main AI job recommendation endpoint
router.post('/analyze', analyzeJobRecommendations);

module.exports = router;