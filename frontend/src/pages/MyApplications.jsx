import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsAPI } from '../services/api';
import { Building2, MapPin, Calendar, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  applied: 'bg-blue-100 text-blue-800 border-blue-200',
  reviewing: 'bg-purple-100 text-purple-800 border-purple-200',
  shortlisted: 'bg-green-100 text-green-800 border-green-200',
  interview: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  applied: 'Applied',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview Scheduled',
  rejected: 'Rejected',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn'
};

export default function MyApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myApplications', filter],
    queryFn: () => applicationsAPI.getMyApplications({
      status: filter === 'all' ? undefined : filter
    })
  });

  const { data: statsData } = useQuery({
    queryKey: ['applicationStats'],
    queryFn: () => applicationsAPI.getStats()
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason }) => applicationsAPI.withdraw(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myApplications']);
      queryClient.invalidateQueries(['applicationStats']);
      setShowWithdrawModal(false);
      setSelectedApp(null);
      setWithdrawReason('');
      alert('Application withdrawn successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to withdraw application');
    }
  });

  const handleWithdraw = (application) => {
    setSelectedApp(application);
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = () => {
    if (selectedApp) {
      withdrawMutation.mutate({
        id: selectedApp._id,
        reason: withdrawReason
      });
    }
  };

  const applications = data?.data?.data?.applications || [];
  const stats = statsData?.data?.data?.stats || {};

  const canWithdraw = (status) => {
    return !['rejected', 'accepted', 'withdrawn'].includes(status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Applications</h1>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {(stats.applied || 0) + (stats.reviewing || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Interview</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.interview || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.accepted || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total || 0})
            </button>
            {Object.keys(statusLabels).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {statusLabels[status]} ({stats[status] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              {filter === 'all' 
                ? "You haven't applied to any jobs yet"
                : `No ${statusLabels[filter].toLowerCase()} applications`}
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="btn-primary"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-semibold text-gray-900 hover:text-primary-600 cursor-pointer"
                        onClick={() => navigate(`/jobs/${application.job._id}`)}
                      >
                        {application.job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          {application.job.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {application.job.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Applied {formatDistanceToNow(new Date(application.applicationDate), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[application.status]}`}>
                        {statusLabels[application.status]}
                      </span>
                      {canWithdraw(application.status) && (
                        <button
                          onClick={() => handleWithdraw(application)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Withdraw application"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {application.coverLetter && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {application.coverLetter.length > 200 
                          ? `${application.coverLetter.substring(0, 200)}...`
                          : application.coverLetter
                        }
                      </p>
                    </div>
                  )}

                  {application.employerNotes && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Employer Notes:</p>
                      <p className="text-sm text-blue-700">{application.employerNotes}</p>
                    </div>
                  )}

                  {application.interview?.scheduled && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Interview Scheduled:</p>
                      <p className="text-sm text-yellow-700">
                        <strong>Date:</strong> {new Date(application.interview.date).toLocaleDateString()}<br/>
                        <strong>Mode:</strong> {application.interview.mode}
                        {application.interview.location && <><br/><strong>Location:</strong> {application.interview.location}</>}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Last updated: {formatDistanceToNow(new Date(application.lastUpdated), { addSuffix: true })}
                    </span>
                    <button
                      onClick={() => navigate(`/jobs/${application.job._id}`)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View Job Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Withdraw Modal */}
    {showWithdrawModal && selectedApp && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Withdraw Application</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to withdraw your application for <strong>{selectedApp.job.title}</strong> at {selectedApp.job.company}?
            </p>

            <div className="mb-4">
              <label htmlFor="withdrawReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                id="withdrawReason"
                rows={4}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Please share why you're withdrawing..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setSelectedApp(null);
                  setWithdrawReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                disabled={withdrawMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
