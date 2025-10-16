import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Brain,
  Briefcase,
  MapPin,
  ExternalLink,
  Building,
  CheckCircle,
  AlertCircle,
  Target,
  FileText
} from 'lucide-react';
import { JobRecommendationFormData } from '../types/jobRecommendation';

// Step 1: Job Search Form Component
const JobSearchForm = ({ formData, setFormData, nextStep }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_of_experience' ? parseInt(value) : value
    }));
  };

  const validateAndNext = () => {
    if (!formData.city || !formData.job_position || !formData.years_of_experience) {
      alert('Please fill in all required fields');
      return;
    }
    nextStep();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Job Search Preferences</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            City in Karnataka <span className="text-red-500">*</span>
          </label>
          <select
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Any">Any</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mysuru">Mysuru</option>
            <option value="Mangaluru">Mangaluru</option>
            <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
            <option value="Belagavi">Belagavi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Job Position <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="job_position"
            value={formData.job_position}
            onChange={handleInputChange}
            placeholder="e.g., Software Engineer, Data Scientist"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="years_of_experience"
            value={formData.years_of_experience}
            onChange={handleInputChange}
            placeholder="e.g., 5"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={validateAndNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Next: Upload Resume
        </button>
      </div>
    </div>
  );
};

// Step 2: Resume Upload Component 
const ResumeUpload = ({ formData, setFormData, prevStep, handleSubmit, isLoading }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    console.log('📁 File input change event triggered');
    const file = e.target.files?.[0] || null;
    console.log('📄 Selected file:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'None');
    
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        console.error('❌ Invalid file type:', file.type, 'File name:', file.name);
        alert('Please select a PDF file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }
    
    console.log('✅ Setting file in form data');
    setFormData(prev => {
      const newData = { ...prev, resume_file: file };
      console.log('🔄 Updated form data:', newData);
      return newData;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    console.log('🚀 Drag and drop event triggered');
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      console.log('📄 Dropped file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        console.error('❌ Invalid file type:', file.type, 'File name:', file.name);
        alert('Please select a PDF file.');
        return;
      }
      console.log('✅ Setting dropped file in form data');
      setFormData(prev => {
        const newData = { ...prev, resume_file: file };
        console.log('🔄 Updated form data from drop:', newData);
        return newData;
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Upload Your Resume</h2>
      </div>
      
      {/* Debug Info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <strong>Debug:</strong> File selected: {formData.resume_file ? 
          `${formData.resume_file.name} (${formData.resume_file.type})` : 
          'None'}
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : formData.resume_file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {formData.resume_file ? (
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <h3 className="text-lg font-bold text-green-700">File Selected</h3>
              <p className="text-green-600">{formData.resume_file.name}</p>
              <p className="text-sm text-gray-500">
                {(formData.resume_file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFormData(prev => ({ ...prev, resume_file: null }));
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <h3 className="text-lg font-bold text-gray-700">Upload Resume</h3>
              <p className="text-gray-500">
                Drag and drop your resume or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-2">
                PDF format required (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            console.log('🔄 Submit button clicked');
            console.log('📋 Current form data before submit:', formData);
            handleSubmit();
          }}
          disabled={isLoading || !formData.resume_file}
          style={{
            opacity: (!formData.resume_file ? 0.5 : 1)
          }}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Finding Jobs with AI...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              Get AI Job Recommendations
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Step 3: Job Results Component
const JobResults = ({ results, resetForm }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Your Job Recommendations</h3>
          </div>
          <button
            onClick={resetForm}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            New Search
          </button>
        </div>

        {results.recommendations?.length > 0 ? (
          <div className="space-y-6">
            <p className="text-gray-600 mb-6">
              Found {results.recommendations.length} jobs matching your profile 
              {results.processingTime && `(${results.processingTime} processing time)`}
            </p>
            
            {results.recommendations.map((job, index) => (
              <div key={job.id || index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h4>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary && (
                        <div className="font-medium text-green-600">
                          {job.salary}
                        </div>
                      )}
                    </div>
                  </div>
                  {(job.matchScore || job.relevanceScore) && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                      {job.matchScore || job.relevanceScore}% Match
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">
                    {job.description?.substring(0, 300)}...
                  </p>
                </div>

                {job.matchingSkills && job.matchingSkills.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-bold text-gray-700 mr-2">Matching Skills:</span>
                    {job.matchingSkills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  {job.whyMatched && (
                    <p className="text-sm text-gray-600 italic">{job.whyMatched}</p>
                  )}
                  {job.externalUrl && (
                    <a
                      href={job.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      Apply Now
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No matches found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or uploading a different resume.
            </p>
            <button
              onClick={resetForm}
              className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function JobRecommendations() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<JobRecommendationFormData>({
    city: 'Bengaluru',
    job_position: 'Senior Frontend Engineer',
    years_of_experience: 5,
    resume_file: null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateJobRecommendations = useCallback(async (data: JobRecommendationFormData) => {
    console.log('🚀 Starting job recommendation process...');
    console.log('📋 Form data received:', {
      city: data.city,
      job_position: data.job_position,
      years_of_experience: data.years_of_experience,
      has_resume: !!data.resume_file,
      resume_name: data.resume_file?.name,
      resume_size: data.resume_file?.size
    });
    
    setIsLoading(true);
    setError(null);
    setResults(null);

    if (!data.resume_file) {
      console.error('❌ No resume file provided');
      setError("Please upload a resume PDF file.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('city', data.city);
      formData.append('job_position', data.job_position);
      formData.append('years_of_experience', data.years_of_experience.toString());
      formData.append('resume', data.resume_file);

      const response = await fetch('http://localhost:5000/api/job-recommendations/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
        setCurrentStep(3);
      } else {
        throw new Error(result.error || 'Failed to get job recommendations');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get job recommendations: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetForm = () => {
    setCurrentStep(1);
    setResults(null);
    setError(null);
    setFormData({
      city: 'Bengaluru',
      job_position: 'Senior Frontend Engineer',
      years_of_experience: 5,
      resume_file: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-6">
            <Brain className="h-6 w-6" />
            <span className="font-bold">AI-Powered Job Search Prompt Generator</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Generate Your Perfect Job Search Prompt
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create a personalized AI prompt that will help you find job opportunities tailored to your skills and experience.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all ${
                  step <= currentStep 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 rounded-full transition-colors ${
                    step < currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Step 1: Job Search Parameters */}
        {currentStep === 1 && (
          <JobSearchForm 
            formData={formData}
            setFormData={setFormData}
            nextStep={() => setCurrentStep(2)}
          />
        )}

        {/* Step 2: Resume Upload */}
        {currentStep === 2 && (
          <ResumeUpload 
            formData={formData}
            setFormData={setFormData}
            prevStep={() => setCurrentStep(1)}
            handleSubmit={() => handleGenerateJobRecommendations(formData)}
            isLoading={isLoading}
          />
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && results && (
          <JobResults 
            results={results}
            resetForm={resetForm}
          />
        )}

      </div>
    </div>
  );
}