import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { jobsAPI, applicationsAPI, externalJobsAPI } from '../services/api';
import { Building2, MapPin, Briefcase, Clock, Calendar, ExternalLink, Users, Award, GraduationCap, TrendingUp, Banknote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function JobDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isExternal = searchParams.get('external') === 'true';
  const navigate = useNavigate();
  const { isAuthenticated, isJobSeeker } = useAuth();
  const queryClient = useQueryClient();
  const [applySuccess, setApplySuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [isExternal ? 'external-job' : 'job', id],
    queryFn: () => {
      if (isExternal) {
        // For external jobs, add source=external parameter
        return jobsAPI.getById(id, { params: { source: 'external' } });
      } else {
        return jobsAPI.getById(id);
      }
    },
  });

  const applyMutation = useMutation({
    mutationFn: (applicationData) => applicationsAPI.apply(applicationData),
    onSuccess: () => {
      setApplySuccess(true);
      queryClient.invalidateQueries(['myApplications']);
      setTimeout(() => setApplySuccess(false), 5000);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to submit application. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Both internal and external jobs return the same structure: data.data.job
  const job = data?.data?.data?.job;

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
          <button onClick={() => navigate('/jobs')} className="btn-primary mt-4">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If job has an external URL, open it directly
    if (job.externalUrl) {
      window.open(job.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For internal jobs, submit application directly without cover letter
    applyMutation.mutate({
      jobId: id,
      coverLetter: '' // No cover letter required
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold flex-1">{job.title}</h1>
            </div>
            
            <div className="flex flex-wrap gap-4 text-white/90 mb-4">
              <span className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                {job.company}
              </span>
              <span className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {job.location}
              </span>
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {job.createdAt || job.postedDate ? formatDistanceToNow(new Date(job.createdAt || job.postedDate), { addSuffix: true }) : 'Recently posted'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {job.jobType}
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {job.workMode}
              </span>
              {job.experienceLevel && (
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {job.experienceLevel}
                </span>
              )}
            </div>

            {isJobSeeker && (
              <button 
                onClick={handleApply} 
                className="bg-white text-primary-600 hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Applying...' : 'Apply Now'}
                {job.externalUrl && <ExternalLink className="h-4 w-4" />}
              </button>
            )}
          </div>

          {applySuccess && (
            <div className="mx-8 mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ Application submitted successfully!</p>
              <p className="text-green-600 text-sm mt-1">You can track your application in the My Applications page.</p>
            </div>
          )}

          {/* Main Content Area with Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column - Main Job Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Salary Section */}
              {job.salary && (job.salary.text || (job.salary.min && job.salary.max && !isNaN(job.salary.min) && !isNaN(job.salary.max))) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-purple-900">
                    <Banknote className="h-6 w-6" />
                    Salary Range
                  </h2>
                  <div className="text-2xl font-bold text-purple-700">
                    {job.salary.text || `₹${(job.salary.min/100000).toFixed(1)}L - ₹${(job.salary.max/100000).toFixed(1)}L`}
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Job Description</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
                
                {isExternal && job.externalUrl && (
                  <div className="mt-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm mb-3 flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>For complete job details, requirements, and responsibilities, please visit the original job posting.</span>
                      </p>
                      <a 
                        href={job.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
                      >
                        View Complete Job Posting
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Responsibilities</h2>
                  <ul className="space-y-3">
                    {job.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && !job.requirements.includes('See job description') && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Requirements</h2>
                  <ul className="space-y-3">
                    {job.requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {job.requirements && job.requirements.includes('See job description') && job.externalUrl && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Requirements</h2>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 mb-3">Detailed requirements are available on the original job posting.</p>
                    <a 
                      href={job.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Complete Job Posting
                    </a>
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Required Skills</h2>
                  <div className="flex flex-wrap gap-3">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-lg text-sm font-medium border border-primary-200 hover:shadow-md transition-shadow"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {job.qualifications && job.qualifications.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Qualifications</h2>
                  <ul className="space-y-3">
                    {job.qualifications.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Benefits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar Information */}
            <div className="space-y-6">
              {/* Experience Card */}
              {job.experience && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-900">
                    <TrendingUp className="h-5 w-5" />
                    Experience Required
                  </h3>
                  <p className="text-2xl font-bold text-blue-700">
                    {job.experience.min} - {job.experience.max} years
                  </p>
                </div>
              )}

              {/* Education Card */}
              {job.education && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-amber-900">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </h3>
                  <p className="text-gray-700 font-medium">{job.education}</p>
                </div>
              )}

              {/* Company Info Card */}
              {job.companyInfo && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </h3>
                  
                  {job.companyInfo.logo && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={job.companyInfo.logo} 
                        alt={`${job.company} logo`}
                        className="h-16 w-auto object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {job.companyInfo.industry && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Industry</p>
                        <p className="text-gray-900 font-medium">{job.companyInfo.industry}</p>
                      </div>
                    )}
                    
                    {job.companyInfo.size && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Company Size
                        </p>
                        <p className="text-gray-900 font-medium">{job.companyInfo.size}</p>
                      </div>
                    )}
                    
                    {job.companyInfo.website && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Website</p>
                        <a 
                          href={job.companyInfo.website.startsWith('http') ? job.companyInfo.website : `https://${job.companyInfo.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                        >
                          Visit Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    
                    {job.companyInfo.description && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">About</p>
                        <p className="text-gray-700 text-sm leading-relaxed">{job.companyInfo.description.substring(0, 250)}{job.companyInfo.description.length > 250 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Posted Date Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5" />
                  Posted
                </h3>
                <p className="text-gray-700 font-medium">
                  {job.createdAt || job.postedDate ? formatDistanceToNow(new Date(job.createdAt || job.postedDate), { addSuffix: true }) : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
