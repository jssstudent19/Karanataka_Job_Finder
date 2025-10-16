const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Different Gemini models to try
  const modelsToTest = [
    'gemini-1.5-flash',        // Faster, cheaper
    'gemini-1.5-flash-8b',     // Even faster, more efficient
    'gemini-1.5-pro',          // More capable but slower
    'gemini-2.0-flash',        // Current model we're using
    'gemini-pro',              // Legacy model
    'gemini-pro-vision'        // Legacy vision model
  ];
  
  console.log('🧪 Testing available Gemini models...\n');
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = "Just respond with 'OK' to test this model.";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: Working - Response: ${text.trim()}`);
      
    } catch (error) {
      console.log(`❌ ${modelName}: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 Recommendation: gemini-1.5-flash-8b is usually fastest and has better rate limits for free tier');
}

// Run the test
testGeminiModels().catch(console.error);