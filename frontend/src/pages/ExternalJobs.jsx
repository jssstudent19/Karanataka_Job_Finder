import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { externalJobsAPI } from '../services/api';
import { 
  Search, MapPin, Briefcase, Clock, Building2, 
  Globe, Filter, X, ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AutocompleteInput from '../components/AutocompleteInput';
import { jobsAPI } from '../services/api';

const SOURCE_COLORS = {
  'apify-linkedin': 'bg-blue-600 text-white',
  'apify-naukri': 'bg-indigo-600 text-white',
  'apify-indeed': 'bg-red-600 text-white',
  jsearch: 'bg-blue-100 text-blue-800',
  adzuna: 'bg-green-100 text-green-800',
  careerjet: 'bg-purple-100 text-purple-800',
  themuse: 'bg-pink-100 text-pink-800',
  remotive: 'bg-orange-100 text-orange-800',
  arbeitnow: 'bg-indigo-100 text-indigo-800',
};

const SOURCE_NAMES = {
  'apify-linkedin': 'LinkedIn',
  'apify-naukri': 'Naukri',
  'apify-indeed': 'Indeed',
  jsearch: 'JSearch',
  adzuna: 'Adzuna',
  careerjet: 'Careerjet',
  themuse: 'The Muse',
  remotive: 'Remotive',
  arbeitnow: 'Arbeitnow',
};

const WORK_MODES = ['All', 'Remote', 'On-site', 'Hybrid'];
const JOB_TYPES = ['All', 'Full-time', 'Contract', 'Internship'];

export default function ExternalJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    company: searchParams.get('company') || '',
    source: searchParams.get('source') || '',
    workMode: searchParams.get('workMode') || '',
    jobType: searchParams.get('jobType') || '',
  });

  // Fetch external jobs
  const { data, isLoading, error } = useQuery({
    queryKey: ['external-jobs', searchParams.toString()],
    queryFn: async () => {
      const result = await externalJobsAPI.getAll(Object.fromEntries(searchParams));
      console.log('External Jobs API Response:', result);
      return result;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['external-jobs-stats'],
    queryFn: async () => {
      const result = await externalJobsAPI.getStats();
      console.log('Stats API Response:', result);
      return result;
    },
  });

  const applyFilters = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.location) params.location = filters.location;
    if (filters.company) params.company = filters.company;
    if (filters.source) params.source = filters.source;
    if (filters.workMode && filters.workMode !== 'All') params.workMode = filters.workMode;
    if (filters.jobType && filters.jobType !== 'All') params.jobType = filters.jobType;
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', company: '', source: '', workMode: '', jobType: '' });
    setSearchParams({});
  };

  // Handle API response structure - external jobs endpoint returns { success: true, data: [...], total, page, pages }
  const jobs = Array.isArray(data?.data?.data) ? data.data.data : [];
  const total = data?.data?.total || 0;
  const page = data?.data?.page || 1;
  const pages = data?.data?.pages || 1;

  // Debug logging
  if (data) {
    console.log('Parsed jobs:', jobs, 'Total:', total, 'Page:', page, 'Pages:', pages);
    console.log('Full pagination:', pagination);
  }

  // Stats endpoint returns { success, data: { stats: {...}, lastUpdated } }
  const stats = statsData?.data?.data?.stats || {};
  const sourceStats = Array.isArray(stats.bySource) ? stats.bySource : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">External Job Opportunities</h1>
              <p className="text-primary-100 text-lg">
                Discover jobs from {sourceStats.length} top job boards
              </p>
            </div>
            <Globe className="h-20 w-20 opacity-50" />
          </div>
          
          {/* Source Stats */}
          {sourceStats.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sourceStats.map((stat) => (
                <div key={stat._id} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-sm text-primary-100">
                    {SOURCE_NAMES[stat._id] || stat._id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Button */}
      <div className="sticky top-16 z-40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">External Jobs</h2>
                {(filters.search || filters.location || filters.company || filters.source || filters.workMode || filters.jobType) && (
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {filters.source && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        Source: {SOURCE_NAMES[filters.source]}
                      </span>
                    )}
                    {filters.workMode && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {filters.workMode}
                      </span>
                    )}
                    {filters.jobType && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
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
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="h-5 w-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Source
                    </label>
                    <select
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Sources</option>
                      {Object.entries(SOURCE_NAMES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Mode
                    </label>
                    <select
                      value={filters.workMode}
                      onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {WORK_MODES.map((mode) => (
                        <option key={mode} value={mode === 'All' ? '' : mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType}
                      onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                      ))}
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {total.toLocaleString()} Jobs Found
            </h2>
            <p className="text-gray-600 mt-1">
              Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} on page {page} of {pages}
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            Updated {stats.recent?.[0]?.postedDate 
              ? formatDistanceToNow(new Date(stats.recent[0].postedDate), { addSuffix: true })
              : 'recently'
            }
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-red-500 text-lg mb-2">Error loading jobs</div>
            <p className="text-gray-600">{error.message}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
            <button onClick={clearFilters} className="mt-4 btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="card p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span className="font-medium">{job.company}</span>
                          <span className="mx-2">•</span>
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{job.location}</span>
                        </div>
                      </div>

                      {/* Source Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${SOURCE_COLORS[job.source] || 'bg-gray-100 text-gray-800'}`}>
                        {SOURCE_NAMES[job.source] || job.source}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                      {job.jobType && (
                        <span className="flex items-center px-3 py-1 bg-gray-100 rounded">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.jobType}
                        </span>
                      )}
                      {job.workMode && (
                        <span className={`px-3 py-1 rounded font-medium ${
                          job.workMode === 'Remote' || job.workMode === 'remote' ? 'bg-green-50 text-green-700' :
                          job.workMode === 'Hybrid' || job.workMode === 'hybrid' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {job.workMode}
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    )}

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.requirements.slice(0, 3).map((req, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-500 flex items-center mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(job.postedDate || job.createdAt), { addSuffix: true })}
                    </div>
                    
                    {job.externalUrl && (
                      <a
                        href={job.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        Apply Now
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <button
                onClick={() => {
                  const params = Object.fromEntries(searchParams);
                  params.page = page - 1;
                  setSearchParams(params);
                }}
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <button
                onClick={() => {
                  const params = Object.fromEntries(searchParams);
                  params.page = page + 1;
                  setSearchParams(params);
                }}
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
