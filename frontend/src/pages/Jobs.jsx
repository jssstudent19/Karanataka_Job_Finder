import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { Search, MapPin, Briefcase, Clock, DollarSign, Building2, Filter, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AutocompleteInput from '../components/AutocompleteInput';

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    company: searchParams.get('company') || '',
    workMode: searchParams.get('workMode') || '',
    jobType: searchParams.get('jobType') || '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', searchParams.toString()],
    queryFn: async () => {
      try {
        const result = await jobsAPI.getAll(Object.fromEntries(searchParams));
        console.log('Jobs API Response:', result);
        return result;
      } catch (err) {
        console.error('Jobs API Error:', err);
        throw err;
      }
    },
  });

  const applyFilters = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.location) params.location = filters.location;
    if (filters.company) params.company = filters.company;
    if (filters.workMode) params.workMode = filters.workMode;
    if (filters.jobType) params.jobType = filters.jobType;
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', company: '', workMode: '', jobType: '' });
    setSearchParams({});
  };

  const jobs = data?.data?.data?.jobs || [];
  const pagination = data?.data?.data?.pagination || {};

  return (
    <div className="min-h-screen">
      {/* Filter Button */}
      <div className="sticky top-16 z-40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">All Jobs</h2>
                {(filters.search || filters.location || filters.company || filters.workMode || filters.jobType) && (
                  <div className="flex items-center gap-2">
                    {filters.search && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        Job: {filters.search}
                      </span>
                    )}
                    {filters.location && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Location: {filters.location}
                      </span>
                    )}
                    {filters.company && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Company: {filters.company}
                      </span>
                    )}
                    {filters.workMode && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {filters.workMode}
                      </span>
                    )}
                    {filters.jobType && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {filters.jobType}
                      </span>
                    )}
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-primary flex items-center gap-2"
              >
                <Filter className="h-5 w-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search by Job Title
                    </label>
                    <AutocompleteInput
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      fetchSuggestions={jobsAPI.getJobTitleSuggestions}
                      placeholder="e.g., Software Engineer"
                      icon={Search}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <AutocompleteInput
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      fetchSuggestions={jobsAPI.getLocationSuggestions}
                      placeholder="e.g., Bangalore"
                      icon={MapPin}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <AutocompleteInput
                      value={filters.company}
                      onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                      fetchSuggestions={jobsAPI.getCompanySuggestions}
                      placeholder="e.g., Google"
                      icon={Building2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Mode
                    </label>
                    <select
                      value={filters.workMode}
                      onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Work Modes</option>
                      <option value="onsite">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType}
                      onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Job Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="btn-primary px-8"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {pagination.totalJobs?.toLocaleString() || 0} Jobs Found
          </h1>
          <p className="text-gray-600 mt-1">
            Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} on page {pagination.currentPage || 1} of {pagination.totalPages || 1}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-red-500 text-lg mb-2">Error loading jobs</div>
            <p className="text-gray-600">{error.response?.data?.message || error.message || 'Failed to load jobs'}</p>
            <button onClick={() => window.location.reload()} className="mt-4 btn-primary">
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}${job.isExternal ? '?external=true' : ''}`}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 block border border-gray-100 hover:border-primary-200 animate-slide-up"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 flex-1 group-hover:text-primary-700 transition-colors">
                        {job.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center mr-2">
                          <Building2 className="h-4 w-4 text-primary-600" />
                        </div>
                        <span className="font-medium">{job.company}</span>
                      </div>
                      <span className="mx-3 text-gray-300">|</span>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-primary-500" />
                        <span>{job.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                      {job.jobType && (
                        <span className="flex items-center px-3 py-1.5 bg-gray-100 rounded-lg font-medium">
                          <Briefcase className="h-4 w-4 mr-1.5 text-gray-500" />
                          {job.jobType}
                        </span>
                      )}
                      {job.workMode && (
                        <span className={`px-3 py-1.5 rounded-lg font-semibold ${
                          job.workMode === 'remote' || job.workMode === 'Remote' ? 'bg-green-100 text-green-700' :
                          job.workMode === 'hybrid' || job.workMode === 'Hybrid' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {job.workMode}
                        </span>
                      )}
                      {job.experience && (
                        <span>
                          {job.experience.min}-{job.experience.max} years
                        </span>
                      )}
                    </div>

                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-lg text-sm font-medium border border-primary-200/50 hover:border-primary-300 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                            +{job.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4 flex flex-col items-end gap-3">
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {job.createdAt && !isNaN(new Date(job.createdAt).getTime()) 
                            ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
                            : 'Recently posted'
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {pagination.hasPrev && (
              <button
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: pagination.currentPage - 1 })}
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            {pagination.hasNext && (
              <button
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: pagination.currentPage + 1 })}
                className="btn-secondary"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
