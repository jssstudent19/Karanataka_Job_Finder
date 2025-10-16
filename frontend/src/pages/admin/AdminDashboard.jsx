import { useAuth } from '../../context/AuthContext';
import { Users, UserCheck, UserX, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    jobSeekers: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setUserStats(response.data.data.users);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users and platform access</p>
            </div>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{userStats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Currently enabled</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Job Seekers</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{userStats.jobSeekers}</p>
                <p className="text-xs text-gray-500 mt-1">Regular users</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{userStats.total - userStats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Deactivated accounts</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Action - Manage Users */}
        <div className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl shadow-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">User Management</h2>
              <p className="text-blue-100 mb-4">Control user access, activate or deactivate accounts</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Activate users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span>Deactivate users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span>View details</span>
                </div>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-3"
            >
              <Users className="h-6 w-6" />
              Manage Users
            </Link>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Admin Controls
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Activate Users</h4>
                <p className="text-sm text-gray-600">Enable user accounts to allow platform access and job searching capabilities.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Deactivate Users</h4>
                <p className="text-sm text-gray-600">Disable user accounts to restrict access while preserving their data for future reactivation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
