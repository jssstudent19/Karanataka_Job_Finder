const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const ParsedResume = require('../models/ParsedResume');
const { authenticateToken, requireJobSeeker } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/matching/recommendations
 * @desc    Get job recommendations based on user's resume (IMPROVED ALGORITHM)
 * @access  Private (Job Seekers only)
 */
router.get('/recommendations', authenticateToken, requireJobSeeker, asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  // Get user's parsed resume
  const parsedResume = await ParsedResume.findOne({ user: req.user._id });
  
  if (!parsedResume || !parsedResume.skills || parsedResume.skills.length === 0) {
    return res.json({
      success: true,
      message: 'Please upload a resume to get personalized recommendations',
      data: {
        recommendations: [],
        matchBasis: 'none'
      }
    });
  }

  // IMPROVED: Get more jobs initially for better filtering (3x the limit)
  const initialLimit = parseInt(limit) * 3;
  
  // Find jobs matching user's skills (case-insensitive)
  const userSkillsLower = parsedResume.skills.map(s => s.toLowerCase());
  const matchedJobs = await Job.find({
    status: 'active',
    requiredSkills: { 
      $elemMatch: { 
        $in: userSkillsLower.map(skill => new RegExp(skill, 'i'))
      }
    }
  })
  .sort({ createdAt: -1 })
  .limit(initialLimit)
  .populate('postedBy', 'name email');
  
  // Calculate comprehensive match score for each job
  const recommendationsWithMatch = matchedJobs.map(job => {
    const skillMatch = parsedResume.calculateSkillMatch(job.requiredSkills);
    const experienceMatch = checkExperienceMatch(parsedResume.totalExperienceYears, job.experience);
    const locationMatch = checkLocationMatch(parsedResume.location, job.location);
    
    // IMPROVED SCORING ALGORITHM
    // Skills: 50%, Experience: 30%, Location: 20%
    const skillScore = skillMatch.percentage * 0.5;
    const experienceScore = experienceMatch.matches ? 30 : (experienceMatch.gap ? Math.max(0, 30 - (experienceMatch.gap * 5)) : 15);
    const locationScore = locationMatch.matches ? 20 : (locationMatch.sameState ? 10 : 0);
    
    const overallScore = Math.round(skillScore + experienceScore + locationScore);
    
    return {
      job: job,
      matchPercentage: overallScore,
      skillMatchPercentage: skillMatch.percentage,
      matchedSkills: skillMatch.matchedSkills,
      missingSkills: skillMatch.missingSkills,
      experienceMatch: experienceMatch,
      locationMatch: locationMatch,
      matchBreakdown: {
        skills: Math.round(skillScore),
        experience: Math.round(experienceScore),
        location: Math.round(locationScore)
      }
    };
  });

  // Sort by overall match score (descending)
  recommendationsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  // Filter: Only show jobs with at least 40% match
  const filteredRecommendations = recommendationsWithMatch.filter(rec => rec.matchPercentage >= 40);
  
  // Limit to requested number
  const finalRecommendations = filteredRecommendations.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: {
      recommendations: finalRecommendations,
      matchBasis: {
        skills: parsedResume.skills.length,
        experience: parsedResume.totalExperienceYears,
        location: parsedResume.location?.city || 'Not specified',
        education: parsedResume.education ? parsedResume.education.length : 0
      },
      totalFound: filteredRecommendations.length,
      algorithm: 'weighted_scoring_v2'
    }
  });
}));

/**
 * @route   POST /api/matching/analyze
 * @desc    Analyze match between user and specific job
 * @access  Private (Job Seekers only)
 */
router.post('/analyze', authenticateToken, requireJobSeeker, asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
  }

  // Get job
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Get user's parsed resume
  const parsedResume = await ParsedResume.findOne({ user: req.user._id });
  
  if (!parsedResume) {
    return res.status(404).json({
      success: false,
      message: 'Please upload a resume first'
    });
  }

  // Calculate skill match
  const skillMatch = parsedResume.calculateSkillMatch(job.requiredSkills);
  
  // Check experience match
  const experienceMatch = checkExperienceMatch(parsedResume.totalExperienceYears, job.experience);
  
  // Calculate overall match score
  const overallMatch = calculateOverallMatch(skillMatch, experienceMatch);

  res.json({
    success: true,
    data: {
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      matchAnalysis: {
        overallScore: overallMatch.score,
        overallRating: overallMatch.rating,
        skills: {
          matchPercentage: skillMatch.percentage,
          matched: skillMatch.matchedSkills,
          missing: skillMatch.missingSkills,
          totalRequired: skillMatch.totalRequired
        },
        experience: experienceMatch,
        recommendation: getRecommendation(overallMatch.score)
      }
    }
  });
}));

/**
 * @route   GET /api/matching/skills-gap
 * @desc    Analyze skills gap for career development
 * @access  Private (Job Seekers only)
 */
router.get('/skills-gap', authenticateToken, requireJobSeeker, asyncHandler(async (req, res) => {
  const { targetRole } = req.query;
  
  // Get user's parsed resume
  const parsedResume = await ParsedResume.findOne({ user: req.user._id });
  
  if (!parsedResume) {
    return res.status(404).json({
      success: false,
      message: 'Please upload a resume first'
    });
  }

  // Find jobs for target role
  const filter = { status: 'active' };
  if (targetRole) {
    filter.title = { $regex: targetRole, $options: 'i' };
  }

  const relevantJobs = await Job.find(filter).limit(20);
  
  // Aggregate all required skills
  const allRequiredSkills = new Set();
  relevantJobs.forEach(job => {
    job.requiredSkills.forEach(skill => allRequiredSkills.add(skill));
  });

  // Find missing skills
  const userSkillsLower = parsedResume.skills.map(s => s.toLowerCase());
  const missingSkills = Array.from(allRequiredSkills).filter(skill => 
    !userSkillsLower.some(userSkill => 
      userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
    )
  );

  // Count skill frequency in jobs
  const skillFrequency = {};
  relevantJobs.forEach(job => {
    job.requiredSkills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  // Sort missing skills by frequency (most in-demand first)
  const prioritizedMissingSkills = missingSkills
    .map(skill => ({
      skill,
      demandCount: skillFrequency[skill] || 0,
      percentage: Math.round((skillFrequency[skill] / relevantJobs.length) * 100)
    }))
    .sort((a, b) => b.demandCount - a.demandCount);

  res.json({
    success: true,
    data: {
      currentSkills: parsedResume.skills,
      missingSkills: prioritizedMissingSkills,
      skillsGapAnalysis: {
        totalJobsAnalyzed: relevantJobs.length,
        totalSkillsRequired: allRequiredSkills.size,
        skillsYouHave: parsedResume.skills.length,
        skillsToLearn: missingSkills.length,
        completionPercentage: Math.round((parsedResume.skills.length / allRequiredSkills.size) * 100)
      },
      targetRole: targetRole || 'All roles'
    }
  });
}));

// Helper functions

function checkExperienceMatch(userExperience, jobExperience) {
  if (!jobExperience || (!jobExperience.min && !jobExperience.max)) {
    return { matches: true, reason: 'No experience requirement specified' };
  }

  const userExp = userExperience || 0;
  const minExp = jobExperience.min || 0;
  const maxExp = jobExperience.max || 100;

  if (userExp >= minExp && userExp <= maxExp) {
    return {
      matches: true,
      reason: `Your ${userExp} years of experience matches the requirement (${minExp}-${maxExp} years)`
    };
  } else if (userExp < minExp) {
    return {
      matches: false,
      reason: `You have ${userExp} years, but ${minExp} years required`,
      gap: minExp - userExp
    };
  } else {
    return {
      matches: true,
      reason: `You have ${userExp} years, exceeding the maximum ${maxExp} years (considered overqualified)`
    };
  }
}

function checkLocationMatch(userLocation, jobLocation) {
  if (!userLocation || !jobLocation) {
    return { matches: false, sameState: false, reason: 'Location not specified' };
  }
  
  const userCity = (userLocation.city || '').toLowerCase();
  const userState = (userLocation.state || '').toLowerCase();
  const jobLoc = jobLocation.toLowerCase();
  
  // Exact city match
  if (userCity && jobLoc.includes(userCity)) {
    return { matches: true, sameState: true, reason: `Same city: ${userCity}` };
  }
  
  // Same state match
  if (userState && jobLoc.includes(userState)) {
    return { matches: false, sameState: true, reason: `Same state: ${userState}` };
  }
  
  // Karnataka match (since it's Karnataka Job Portal)
  if (jobLoc.includes('karnataka')) {
    return { matches: false, sameState: true, reason: 'Within Karnataka' };
  }
  
  return { matches: false, sameState: false, reason: 'Different location' };
}

function calculateOverallMatch(skillMatch, experienceMatch) {
  // Weight: 70% skills, 30% experience
  const skillScore = (skillMatch.percentage / 100) * 70;
  const expScore = experienceMatch.matches ? 30 : 15;
  
  const totalScore = Math.round(skillScore + expScore);
  
  let rating;
  if (totalScore >= 80) rating = 'Excellent';
  else if (totalScore >= 60) rating = 'Good';
  else if (totalScore >= 40) rating = 'Fair';
  else rating = 'Poor';

  return { score: totalScore, rating };
}

function getRecommendation(score) {
  if (score >= 80) {
    return 'Excellent match! You should definitely apply for this position.';
  } else if (score >= 60) {
    return 'Good match! You have a strong chance. Consider applying.';
  } else if (score >= 40) {
    return 'Fair match. You meet some requirements but may want to develop additional skills.';
  } else {
    return 'This role may be challenging. Consider building more relevant skills first.';
  }
}

module.exports = router;