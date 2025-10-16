import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, Clock, DollarSign, ArrowRight, Target, Zap } from 'lucide-react';

export default function Home() {


  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-gray-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - SVG Illustration */}
            <div className="flex justify-center lg:justify-start animate-slide-left">
              <div className="max-w-lg w-full">
                <img 
                  src="/location.svg" 
                  alt="Karnataka Location Illustration" 
                  className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>
            
            {/* Right Side - Content */}
            <div className="text-center lg:text-left">
              {/* Hot Air Balloon Icon */}
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 animate-float">
                  <img 
                    src="/undraw_hot-air-balloon_6knx.svg" 
                    alt="Hot Air Balloon" 
                    className="w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 animate-slide-up">
                <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Find Your Dream Job
                </span>
                <br />
                <span className="text-white">in Karnataka</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl lg:mx-0 mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
                Connect with top companies and discover opportunities across Karnataka
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get started in 3 simple steps
          </p>
        </div>
        
        {/* SVG Illustration */}
        <div className="flex justify-center mb-16">
          <div className="max-w-md w-full animate-scale-in">
            <img 
              src="/undraw_sharing-knowledge.svg" 
              alt="Sharing Knowledge - Job Portal Illustration" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center group animate-slide-up">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-3xl font-bold shadow-lg">
                1
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Account</h3>
            <p className="text-gray-600 leading-relaxed">
              Sign up for free and create your professional profile in minutes
            </p>
          </div>
          <div className="text-center group animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-3xl font-bold shadow-lg">
                2
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Search & Apply</h3>
            <p className="text-gray-600 leading-relaxed">
              Browse thousands of jobs and apply with one click
            </p>
          </div>
          <div className="text-center group animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white text-3xl font-bold shadow-lg">
                3
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Hired</h3>
            <p className="text-gray-600 leading-relaxed">
              Connect with employers and land your dream job
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">Start Your Career Journey Today</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of job seekers and find your next opportunity today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-md shadow-primary-500/10 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200 flex items-center gap-2 justify-center"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/jobs"
              className="px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-md shadow-primary-500/10 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200 flex items-center gap-2 justify-center"
            >
              Browse Jobs
              <Briefcase className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
