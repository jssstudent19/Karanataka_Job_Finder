import { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Database, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function JobAggregation() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    bySource: {},
    lastUpdated: null
  });
  const [fetchResult, setFetchResult] = useState(null);
  const [error, setError] = useState(null);

  // Configuration for job sources
  const [config, setConfig] = useState({
    location: 'Karnataka,India',
    limitPerSource: 50,
    sources: ['jsearch', 'adzuna', 'careerjet'] // LinkedIn temporarily disabled due to quota
  });

  const sourceInfo = {
    jsearch: { name: 'JSearch', color: 'green', limit: '2,500/month' },
    adzuna: { name: 'Adzuna', color: 'purple', limit: '1,000/month' },
    careerjet: { name: 'Careerjet', color: 'orange', limit: 'Unlimited' }
  };

  // Fetch current job stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/external-jobs/stats`);
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch jobs from all sources
  const handleFetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    setFetchResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/external-jobs/admin/scrape`,
        config,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setFetchResult(response.data);
        setLastFetch(new Date());
        
        // Refresh stats after a delay (give time for jobs to be saved)
        setTimeout(() => {
          fetchStats();
        }, 5000);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="h-7 w-7 mr-3 text-primary-600" />
              Job Aggregation Control
            </h2>
            <p className="text-gray-600 mt-1">
              Manually fetch jobs from multiple sources to save API quota
            </p>
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Jobs</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalJobs || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Jobs</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalJobs || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Sources</p>
                <p className="text-2xl font-bold text-purple-900">{config.sources.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Last Fetch</p>
                <p className="text-sm font-semibold text-orange-900">
                  {lastFetch ? lastFetch.toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Source Breakdown */}
        {stats.bySource && Object.keys(stats.bySource).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Jobs by Source</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 capitalize">{source}</p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fetch Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Karnataka,India"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jobs per Source (Limit)
              </label>
              <input
                type="number"
                value={config.limitPerSource}
                onChange={(e) => setConfig({ ...config, limitPerSource: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="10"
                max="200"
              />
            </div>
          </div>

          {/* Source Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Active Sources
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(sourceInfo).map(([key, info]) => (
                <div
                  key={key}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    info.disabled
                      ? 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
                      : config.sources.includes(key)
                      ? `border-${info.color}-500 bg-${info.color}-50 cursor-pointer`
                      : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (info.disabled) return; // Don't allow selection if disabled
                    setConfig({
                      ...config,
                      sources: config.sources.includes(key)
                        ? config.sources.filter((s) => s !== key)
                        : [...config.sources, key]
                    });
                  }}
                  title={info.disabled ? info.warning : ''}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={config.sources.includes(key)}
                      disabled={info.disabled}
                      onChange={() => {}}
                      className="rounded text-primary-600"
                    />
                    <span className={`font-semibold text-sm ${info.disabled ? 'line-through' : ''}`}>
                      {info.name}
                    </span>
                  </div>
                  <p className={`text-xs ${info.disabled ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {info.disabled ? info.warning : info.limit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fetch Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleFetchJobs}
              disabled={isLoading || config.sources.length === 0}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isLoading || config.sources.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Fetching Jobs...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Fetch Jobs from {config.sources.length} Sources</span>
                </>
              )}
            </button>

            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {config.sources.length === 0 && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Please select at least one source to fetch jobs
            </p>
          )}

          <p className="text-sm text-gray-500 mt-3">
            💡 <strong>Tip:</strong> Estimated max jobs: {config.sources.length * config.limitPerSource}
            {' '}(actual results may vary based on available jobs)
          </p>
        </div>
      </div>

      {/* Success Message */}
      {fetchResult && !error && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">Job Fetch Initiated!</h4>
              <p className="text-sm text-green-700 mb-2">{fetchResult.message}</p>
              <div className="bg-white rounded-lg p-3 text-sm">
                <p><strong>Location:</strong> {fetchResult.config.location}</p>
                <p><strong>Sources:</strong> {fetchResult.config.sources.join(', ')}</p>
                <p><strong>Limit per source:</strong> {fetchResult.config.limitPerSource}</p>
                <p><strong>Estimated max jobs:</strong> {fetchResult.config.estimatedMaxJobs}</p>
              </div>
              <p className="text-xs text-green-600 mt-2">
                ⏳ Jobs are being fetched in the background. Stats will update in ~5 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Usage Tips */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          API Rate Limit Tips
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1 ml-7">
          <li>• <strong>LinkedIn:</strong> Limited requests - Use sparingly (best quality data)</li>
          <li>• <strong>JSearch:</strong> 2,500 requests/month</li>
          <li>• <strong>Adzuna:</strong> 1,000 requests/month</li>
          <li>• <strong>Careerjet:</strong> Generous limits</li>
          <li>• Fetch jobs 1-2 times per day maximum</li>
          <li>• Each fetch fetches multiple jobs, so use wisely!</li>
        </ul>
      </div>
    </div>
  );
}
