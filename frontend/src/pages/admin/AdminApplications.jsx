import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsAPI } from '../../services/api';
import api from '../../services/api';
import { Building2, MapPin, Calendar, User, Mail, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const statusColors = {
  applied: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-purple-100 text-purple-800',
  shortlisted: 'bg-green-100 text-green-800',
  interview: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  withdrawn: 'bg-gray-100 text-gray-800'
};

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' }
];

export default function AdminApplications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [employerNotes, setEmployerNotes] = useState('');

  // Fetch all applications
  const { data, isLoading } = useQuery({
    queryKey: ['adminApplications', filter],
    queryFn: () => api.get('/applications/admin/all', {
      params: {
        status: filter === 'all' ? undefined : filter,
        limit: 50
      }
    })
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => 
      api.put(`/applications/admin/${id}/status`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminApplications']);
      setShowStatusModal(false);
      setSelectedApp(null);
      setNewStatus('');
      setEmployerNotes('');
      alert('Application status updated successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  });

  const applications = data?.data?.data?.applications || [];
  const pagination = data?.data?.data?.pagination || {};

  const handleUpdateStatus = (application) => {
    setSelectedApp(application);
    setNewStatus(application.status);
    setEmployerNotes(application.employerNotes || '');
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedApp && newStatus) {
      updateStatusMutation.mutate({
        id: selectedApp._id,
        status: newStatus,
        notes: employerNotes
      });
    }
  };

  // Get statistics
  const getStatistics = () => {
    const stats = {
      total: 0,
      applied: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      rejected: 0,
      accepted: 0,
      withdrawn: 0
    };

    applications.forEach(app => {
      stats[app.status] = (stats[app.status] || 0) + 1;
      stats.total++;
    });

    return stats;
  };

  const stats = getStatistics();

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Application Management</h1>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Applied</p>
            <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Reviewing</p>
            <p className="text-2xl font-bold text-purple-600">{stats.reviewing}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Shortlisted</p>
            <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Interview</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.interview}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Accepted</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Withdrawn</p>
            <p className="text-2xl font-bold text-gray-600">{stats.withdrawn}</p>
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
              All Applications ({stats.total})
            </button>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label} ({stats[option.value] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No applications found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{application.applicant.name}</div>
                          <div className="text-sm text-gray-500">{application.applicant.email}</div>
                          {application.applicant.skills && application.applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {application.applicant.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {application.applicant.skills.length > 3 && (
                                <span className="px-2 py-1 text-gray-500 text-xs">
                                  +{application.applicant.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{application.job.title}</div>
                          <div className="text-sm text-gray-500">{application.job.company}</div>
                          <div className="text-sm text-gray-500">{application.job.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(application.applicationDate), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
                          {statusOptions.find(s => s.value === application.status)?.label || application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdateStatus(application)}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            {pagination.totalApplications > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{applications.length}</span> of{' '}
                  <span className="font-medium">{pagination.totalApplications}</span> applications
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Update Status Modal */}
    {showStatusModal && selectedApp && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Update Application Status</h2>
          </div>

          <div className="p-6">
            {/* Applicant Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Applicant Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="font-medium">{selectedApp.applicant.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email:</p>
                  <p className="font-medium">{selectedApp.applicant.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-600 mb-2">Job:</p>
                <p className="font-medium">{selectedApp.job.title}</p>
                <p className="text-sm text-gray-500">{selectedApp.job.company} • {selectedApp.job.location}</p>
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApp.coverLetter && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedApp.coverLetter}
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employer Notes */}
            <div className="mb-6">
              <label htmlFor="employerNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Employer Notes (Optional)
              </label>
              <textarea
                id="employerNotes"
                rows={4}
                value={employerNotes}
                onChange={(e) => setEmployerNotes(e.target.value)}
                placeholder="Add notes about this applicant or the decision..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">{employerNotes.length}/1000 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedApp(null);
                  setNewStatus('');
                  setEmployerNotes('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                disabled={updateStatusMutation.isPending || !newStatus}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
