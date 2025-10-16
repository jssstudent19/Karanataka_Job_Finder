import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle, XCircle, Sparkles, Brain, Zap, Target, 
  TrendingUp, Clock, Download, Trash2, AlertCircle, Award, Lightbulb, BarChart3
} from 'lucide-react';
import { resumeAPI, atsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function UploadResume() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [experienceYears, setExperienceYears] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('0');
  const [jobDescription, setJobDescription] = useState('');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      alert('Please login to upload your resume');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'jobseeker') {
      alert('Only job seekers can upload resumes');
      navigate('/');
      return;
    }
  }, [navigate]);

  const analyzeResume = async (file, years, months, jobDesc) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Read file as text
      const text = await file.text();
      
      // Call ATS Scanner API
      const atsResponse = await atsAPI.analyze({
        resumeText: text,
        jobDescription: jobDesc
      });
      
      const atsResult = atsResponse.data.data;
      
      // Set ATS analysis results
      setResumeData({
        atsScore: atsResult.analysis.atsScore,
        overallRating: atsResult.analysis.overallRating,
        matchedSkills: atsResult.analysis.matchedSkills,
        missingSkills: atsResult.analysis.missingSkills,
        strengths: atsResult.analysis.strengths,
        weaknesses: atsResult.analysis.weaknesses,
        suggestions: atsResult.analysis.suggestions,
        improvementTips: atsResult.improvementTips,
        detailedAnalysis: atsResult.analysis.detailedAnalysis,
        experienceMatch: atsResult.analysis.experienceMatch,
        educationMatch: atsResult.analysis.educationMatch
      });
      
      setAnalysisComplete(true);
      
    } catch (error) {
      console.error('ATS analysis error:', error);
      setError(error.response?.data?.message || 'Failed to analyze resume. Please try again.');
      setAnalysisComplete(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Redirect to ATS Scanner page with file
      alert('Redirecting to ATS Scanner for resume analysis...');
      navigate('/ats-scanner');
    }
  }, [navigate]);
  
  const handleExperienceSubmit = () => {
    if (experienceYears === '' || experienceYears === null) {
      alert('Please enter your years of experience (enter 0 if you are a fresher)');
      return;
    }
    
    if (!jobDescription.trim()) {
      alert('Please enter the job description from the recruiter');
      return;
    }
    
    setShowExperienceModal(false);
    
    // Start ATS analysis with user-provided data
    setTimeout(() => {
      analyzeResume(uploadedFile, experienceYears, experienceMonths, jobDescription);
    }, 500);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  const removeFile = () => {
    setUploadedFile(null);
    setAnalysisComplete(false);
    setMatchedJobs([]);
    setResumeData(null);
    setError(null);
  };

  const handleApply = async (jobId) => {
    try {
      await applicationsAPI.apply({ jobId });
      alert('Application submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply. Please try again.');
    }
  };

  const handleViewDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 75) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  const getMatchScoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 75) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">AI-Powered Job Matching</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              Upload Your Resume
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and use our AI-powered Resume Scanner to optimize it for job applications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Area */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 animate-scale-in">
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
                        PDF, DOC, DOCX • Max 5MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Uploaded File */}
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
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
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-900">Analysis Failed</p>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis Status */}
                  {analyzing && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Analyzing Resume...</p>
                        <p className="text-sm text-blue-600">AI is processing your document</p>
                      </div>
                    </div>
                  )}

                  {analysisComplete && !error && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">Analysis Complete!</p>
                        <p className="text-sm text-green-600">
                          Found {matchedJobs.length} matching jobs
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Smart Parsing</p>
                    <p className="text-xs text-gray-600">AI extracts skills, experience & education</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">ATS Scanner</p>
                    <p className="text-xs text-gray-600">Check resume compatibility with jobs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Instant Analysis</p>
                    <p className="text-xs text-gray-600">Get detailed feedback in seconds</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200/50 p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Pro Tips</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Use a clean, well-formatted resume</li>
                    <li>• Include relevant keywords</li>
                    <li>• Keep file size under 5MB</li>
                    <li>• Update regularly for better matches</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {!uploadedFile ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Upload Resume to Get Started
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Once you upload your resume, our AI will parse it and extract your skills, experience, and qualifications
                </p>
              </div>
            ) : analyzing ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
                  <Brain className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Analyzing Your Resume...
                </h3>
                <p className="text-gray-600 mb-6">
                  Our AI is analyzing your resume against the job description for ATS compatibility
                </p>
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-progress"></div>
                  </div>
                </div>
              </div>
            ) : analysisComplete ? (
              <div className="space-y-6">
                {/* Resume Summary */}
                {resumeData && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 animate-slide-up">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Resume Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="font-semibold text-gray-900">{resumeData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Experience</p>
                        <p className="font-semibold text-gray-900">{resumeData.experience}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <p className="font-semibold text-gray-900">{resumeData.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Education</p>
                        <p className="font-semibold text-gray-900">{resumeData.education}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Key Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Matched Jobs */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Matched Jobs ({matchedJobs.length})
                    </h3>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Download Report
                    </button>
                  </div>

                  <div className="space-y-4">
                    {matchedJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="group border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:border-blue-300 bg-white animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h4>
                            <p className="text-gray-600 font-medium">{job.company}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <span>📍</span> {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" /> {job.posted}
                              </span>
                              <span className="font-semibold text-green-600">
                                {job.salary}
                              </span>
                            </div>
                          </div>
                          <div className={`flex flex-col items-center justify-center h-20 w-20 rounded-xl border-2 ${getMatchScoreBg(job.matchScore)}`}>
                            <div className={`text-2xl font-black bg-gradient-to-br ${getMatchScoreColor(job.matchScore)} bg-clip-text text-transparent`}>
                              {job.matchScore}%
                            </div>
                            <div className="text-xs text-gray-600 font-semibold">Match</div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Why you're a great fit:
                          </p>
                          <ul className="space-y-1">
                            {job.matchReasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleApply(job.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            Apply Now
                          </button>
                          <button 
                            onClick={() => handleViewDetails(job.id)}
                            className="px-4 py-2.5 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg font-semibold transition-all duration-200"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600 rounded-2xl shadow-2xl p-8 text-center text-white animate-scale-in">
          <Sparkles className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Want Even Better Matches?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Create a complete profile to get personalized job recommendations and let employers find you
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl">
            Complete Your Profile
          </button>
        </div>
      </div>

      {/* Experience Input Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-scale-in my-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Resume Details Required
              </h3>
              <p className="text-gray-600">
                Please provide your experience and the job description you're applying for
              </p>
            </div>

            <div className="space-y-4">
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
                  autoFocus
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description from Recruiter <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;- Required skills&#10;- Experience requirements&#10;- Job responsibilities&#10;- Qualifications"
                  className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {jobDescription.length} characters • This helps us match your resume better
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExperienceModal(false);
                    setUploadedFile(null);
                    setExperienceYears('');
                    setExperienceMonths('0');
                    setJobDescription('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExperienceSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
