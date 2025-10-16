import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, XCircle, Brain, User, Mail, Phone, 
  MapPin, GraduationCap, Briefcase, Code, Award, FolderGit2
} from 'lucide-react';

export default function ResumeAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);

  const analyzeResume = async (file) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/resume-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResumeData(data.data);
        setAnalysisComplete(true);
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('Resume analysis error:', error);
      setError(error.message || 'Failed to analyze resume. Please try again.');
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
      setResumeData(null);
      setError(null);
      analyzeResume(file);
    }
  }, []);

  const removeFile = () => {
    setUploadedFile(null);
    setAnalysisComplete(false);
    setResumeData(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Resume Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Upload your resume to extract all information automatically
          </p>
        </div>

        {!analysisComplete && (
          <>
            {/* Upload Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Your Resume
              </h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                    </p>
                    <p className="text-gray-600 mb-4">or click to browse files</p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, DOCX, TXT (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button onClick={removeFile} className="text-red-500 hover:text-red-700">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Analyzing State */}
            {analyzing && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Analyzing Your Resume...
                    </h3>
                    <p className="text-gray-600">
                      Extracting skills, experience, education, and more
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-bold text-red-900">Analysis Failed</h3>
                </div>
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </>
        )}

        {/* Results Section */}
        {analysisComplete && resumeData && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Resume Analysis Complete</h2>
                <button
                  onClick={() => {
                    setAnalysisComplete(false);
                    setResumeData(null);
                    setUploadedFile(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Analyze Another Resume
                </button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    All information has been extracted and saved to your profile!
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            {resumeData.personalInfo && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumeData.personalInfo.name && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-semibold text-gray-900">{resumeData.personalInfo.name}</p>
                      </div>
                    </div>
                  )}
                  {resumeData.personalInfo.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{resumeData.personalInfo.email}</p>
                      </div>
                    </div>
                  )}
                  {resumeData.personalInfo.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-semibold text-gray-900">{resumeData.personalInfo.phone}</p>
                      </div>
                    </div>
                  )}
                  {resumeData.personalInfo.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-semibold text-gray-900">{resumeData.personalInfo.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  Skills ({resumeData.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-800 rounded-full text-sm font-medium hover:shadow-md transition-shadow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resumeData.education && resumeData.education.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  Education
                </h3>
                <div className="space-y-4">
                  {resumeData.education.map((edu, index) => (
                    <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-700 font-medium">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.year}</p>
                      {edu.details && <p className="text-sm text-gray-600 mt-2">{edu.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {resumeData.experience.map((exp, index) => (
                    <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-bold text-gray-900">{exp.title}</h4>
                      <p className="text-gray-700 font-medium">{exp.company}</p>
                      <p className="text-sm text-gray-600 mb-2">{exp.duration}</p>
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {exp.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-orange-600" />
                  Projects
                </h3>
                <div className="space-y-4">
                  {resumeData.projects.map((project, index) => (
                    <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-bold text-gray-900">{project.name}</h4>
                      <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {resumeData.achievements && resumeData.achievements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements & Certifications
                </h3>
                <div className="space-y-2">
                  {resumeData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Award className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
