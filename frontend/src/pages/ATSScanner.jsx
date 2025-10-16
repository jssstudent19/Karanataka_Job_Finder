import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle, XCircle, Sparkles, Brain, Zap, Target, 
  TrendingUp, AlertCircle, Award, BookOpen, Lightbulb, BarChart3, FileCheck
} from 'lucide-react';
import { atsAPI } from '../services/api';

export default function ATSScanner() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('0');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [error, setError] = useState(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      alert('Please login to use ATS Scanner');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'jobseeker') {
      alert('Only job seekers can use ATS Scanner');
      navigate('/');
      return;
    }
  }, [navigate]);

  const analyzeResume = async (file, jobDesc) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Step 1: Upload resume to backend for proper PDF/DOC parsing
      const formData = new FormData();
      formData.append('resume', file);
      
      const token = localStorage.getItem('token');
      
      const uploadResponse = await fetch('http://localhost:5000/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload resume');
      }
      
      // Step 2: Call ATS analysis (backend will use the uploaded file's extracted text)
      const response = await atsAPI.analyze({
        resumeText: '', // Empty - backend will extract from uploaded file
        jobDescription: jobDesc
      });
      
      setAtsResult(response.data.data);
      setAnalysisComplete(true);
      
    } catch (error) {
      console.error('ATS analysis error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to analyze resume. Please try again.');
      setAnalysisComplete(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisComplete(false);
      setAtsResult(null);
      setError(null);
    }
  }, []);

  const handleAnalyze = () => {
    if (!uploadedFile) {
      alert('Please upload your resume first');
      return;
    }
    
    if (experienceYears === '' || experienceYears === null) {
      alert('Please enter your years of experience (enter 0 if you are a fresher)');
      return;
    }
    
    if (!jobDescription.trim()) {
      alert('Please enter the job description');
      return;
    }
    
    analyzeResume(uploadedFile, jobDescription);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  const removeFile = () => {
    setUploadedFile(null);
    setAnalysisComplete(false);
    setAtsResult(null);
    setError(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
            <FileCheck className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">AI-Powered ATS Scanner</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              ATS Resume Scanner
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Check how well your resume matches the job description and get AI-powered suggestions to improve your ATS score
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Job Description */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Step 1: Upload Your Resume
              </h2>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        Drop your resume here
                      </p>
                      <p className="text-sm text-gray-500 mb-2">or click to browse</p>
                      <p className="text-xs text-gray-400">
                        PDF, DOC, DOCX, TXT • Max 5MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Experience Input */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Step 2: Your Experience
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 0 if you are a fresher</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Months
                  </label>
                  <select
                    value={experienceMonths}
                    onChange={(e) => setExperienceMonths(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(month => (
                      <option key={month} value={month}>
                        {month} {month === 1 ? 'month' : 'months'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Step 3: Paste Job Description
              </h2>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;- Required skills&#10;- Experience requirements&#10;- Education requirements&#10;- Job responsibilities&#10;- Qualifications"
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {jobDescription.length} characters
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={!uploadedFile || !jobDescription.trim() || analyzing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Analyze Resume
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">Analysis Failed</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {analysisComplete && atsResult && (
              <div className="space-y-6">
                {/* ATS Score */}
                <div className={`rounded-2xl shadow-lg border-2 p-8 text-center ${getScoreBg(atsResult.analysis.atsScore)}`}>
                  <Award className={`h-16 w-16 mx-auto mb-4 ${getScoreColor(atsResult.analysis.atsScore)}`} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">ATS Score</h2>
                  <div className={`text-6xl font-black mb-2 ${getScoreColor(atsResult.analysis.atsScore)}`}>
                    {atsResult.analysis.atsScore}%
                  </div>
                  <p className="text-lg font-semibold text-gray-700">
                    {atsResult.analysis.overallRating}
                  </p>
                </div>

                {/* Matched Skills */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Matched Skills ({atsResult.analysis.matchedSkills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.analysis.matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                {atsResult.analysis.missingSkills.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Missing Skills ({atsResult.analysis.missingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.analysis.missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {atsResult.analysis.strengths.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {atsResult.analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {atsResult.analysis.suggestions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Improvement Suggestions
                    </h3>
                    <ul className="space-y-3">
                      {atsResult.analysis.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700 p-3 bg-yellow-50 rounded-lg">
                          <span className="font-bold text-yellow-600">{idx + 1}.</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvement Tips */}
                {atsResult.improvementTips && atsResult.improvementTips.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Quick Wins
                    </h3>
                    <div className="space-y-3">
                      {atsResult.improvementTips.map((tip, idx) => (
                        <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-purple-900">{tip.category}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              tip.priority === 'high' ? 'bg-red-100 text-red-800' :
                              tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {tip.priority} priority
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{tip.tip}</p>
                          <p className="text-xs text-gray-500">{tip.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Analysis */}
                {atsResult.analysis.detailedAnalysis && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Detailed Analysis
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {atsResult.analysis.detailedAnalysis}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!analysisComplete && !error && !analyzing && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600">
                  Upload your resume and paste the job description to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
