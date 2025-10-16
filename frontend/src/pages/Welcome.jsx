import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Briefcase, Upload, User, CheckCircle, ArrowRight, Sparkles, Target } from 'lucide-react';

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Welcome to Karnataka Jobs</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're excited to help you find your dream job in Karnataka. Let's get you started on your career journey!
          </p>
        </div>

        {/* App Introduction */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 mb-8 animate-slide-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Karnataka Job Portal</h2>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Our platform connects talented professionals like you with top companies across Karnataka. 
              We use AI-powered matching to find the perfect job opportunities based on your skills and preferences.
            </p>
          </div>
        </div>

        {/* Profile Completion Section */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl border border-primary-200 p-8 mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Complete Your Profile</h3>
            <p className="text-gray-600 leading-relaxed">
              A complete profile increases your chances of getting noticed by employers and receiving relevant job recommendations.
            </p>
          </div>

          {/* Two Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Option - Upload Resume */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-primary-100">
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Quick & Easy</h4>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  Upload your resume and we'll automatically extract your information to complete your profile using AI.
                </p>
                <Link
                  to="/upload-resume"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Upload Resume
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Manual Option - Complete Profile */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-primary-100">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Manual Setup</h4>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  Manually fill out your profile information, skills, experience, and preferences.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <Link 
            to="/jobs" 
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">Browse Jobs</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Explore thousands of job opportunities across Karnataka
              </p>
            </div>
          </Link>

          <Link 
            to="/job-recommendations" 
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">AI Job Matching</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get personalized job recommendations powered by AI
              </p>
            </div>
          </Link>
        </div>

        {/* Current Profile Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mt-8 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Current Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}