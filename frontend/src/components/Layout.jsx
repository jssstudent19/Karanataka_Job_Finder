import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, LogOut, Search, Plus, FileText, Upload, Brain, Users, Home } from 'lucide-react';

export default function Layout() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hide Upload Resume on home, login, and signup pages
  const hideUploadResume = ['/', '/login', '/register'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 px-8">
            <div className="flex justify-between items-center h-16 min-h-[64px] w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
              {/* Modern Logo Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
                  Karnataka Jobs
                </span>
                <span className="text-xs font-bold text-gray-500 -mt-0.5 tracking-wide hidden lg:block">Find Your Dream Career</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-3 flex-shrink min-w-0">
              {/* Show Find Jobs only for non-admin users */}
              {!isAdmin && (
                <Link
                  to="/jobs"
                  className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-lg shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 whitespace-nowrap"
                >
                  Find Jobs
                </Link>
              )}
              
              {/* Show Upload Resume only for authenticated non-admin users and not on restricted pages */}
              {!hideUploadResume && !isAdmin && isAuthenticated && (
                <Link
                  to="/upload-resume"
                  className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-md shadow-green-500/10 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload Resume</span>
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  {/* Home Icon for signed-in users */}
                  <Link
                    to="/welcome"
                    className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-lg shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                    title="Home"
                  >
                    <Home className="h-5 w-5" />
                    <span className="hidden lg:inline">Home</span>
                  </Link>
                  
                  {!isAdmin && (
                    <Link
                      to="/job-recommendations"
                      className="px-2 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-md shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                    >
                      <Brain className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span className="hidden lg:inline">Get Job Recommendations</span>
                      <span className="lg:hidden">AI Jobs</span>
                    </Link>
                  )}
                  
                  {isAdmin && (
                    <Link
                      to="/admin/users"
                      className="px-2 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-md shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                    >
                      <Users className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>Manage Users</span>
                    </Link>
                  )}
                  
                  {/* User Profile */}
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-base font-bold text-gray-900 hidden lg:block">
                        {user?.name?.split(' ')[0]}
                      </span>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-lg shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 text-base font-black text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-xl shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2025 Karnataka Job Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
