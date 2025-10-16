require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiDirect() {
  console.log('🧪 Testing Gemini API directly...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }

  const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const prompt = `SYSTEM:
You are Gemini 2.5 Pro, an expert job-aggregation agent with web access. Your job: actively search and scrape job postings to find the best matches for a candidate. Obey robots.txt, rate limits, and site terms. If blocked or disallowed from scraping a source, note it in status.unavailable_sources and continue. Include last 24 hours of job posting. Return JSON only (see schema below), then a 6-line human summary. Do not include any other commentary.

USER:
Inputs:
- city: "Bengaluru"
- job_position: "Software Engineer"
- years_of_experience: 5
- candidate_skills: ["JavaScript", "React", "Node.js"]

Instructions (do these exactly):
1) Actively search and scrape job postings from as many sources as possible (LinkedIn, Naukri, Indeed, Glassdoor, Monster, AngelList/Wellfound, company career pages, GitHub/StackOverflow jobs, regional portals, government portals, recruitment agencies, alumni boards, and major aggregators/APIs). Try to follow links from aggregator results to original company pages when available.
2) For each posting capture: id, title, company, location_city, is_remote (Yes|No|Hybrid), posting_date (YYYY-MM-DD), skills_required (list), min_experience, max_experience, salary_range (if present), job_description_snippet (<=300 chars), application_url, source (domain), other_sources (list), full_raw_text or summary if very long.
3) Filter: if city != "Any", include only jobs in that Karnataka city. If city == "Any", include jobs across Karnataka only. Prioritize postings in the last 24 hours.
4) Deduplicate identical postings (same title+company+url or same unique job id). Keep the most complete record and list other_sources.
5) Compute match_score (0–100) per posting using skill overlap from 'candidate_skills', title similarity, experience fit, location, and recency. Include missing_skills (important skills not in the candidate's skill list). Provide why_matched (1–2 sentences).
6) Rank by match_score desc and return top 10.
7) If live web access is unavailable for any source, include it in status.unavailable_sources and continue.
8) Respect privacy & legality: do not disclose scraping credentials or private API keys.

OUTPUT: return valid JSON only using this top-level schema (no extra text before JSON):
{
  "jobs": [ up to 10 job objects as described above ]
}`;

  try {
    console.log('📤 Sending request to Gemini...');
    
    const model = geminiAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received!');
    console.log('📄 Response length:', text.length);
    console.log('🔍 Full Response:');
    console.log('=' .repeat(80));
    console.log(text);
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    if (error.response) {
      console.error('📄 Error response:', error.response);
    }
  }
}

testGeminiDirect();