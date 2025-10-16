import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Welcome from './pages/Welcome';
import MyApplications from './pages/MyApplications';
import UploadResume from './pages/UploadResume';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import TestPDF from './pages/TestPDF';
import Profile from './pages/Profile';
import ManageUsers from './pages/admin/ManageUsers';
import JobRecommendations from './pages/JobRecommendations';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="upload-resume" element={<ResumeAnalyzer />} />
        <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
        <Route path="test-pdf" element={<TestPDF />} />
        
        {/* Protected Routes */}
        <Route
          path="welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect old dashboard route to welcome */}
        <Route 
          path="dashboard" 
          element={<Navigate to="/welcome" replace />} 
        />
        
        <Route
          path="applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="job-recommendations"
          element={
            <ProtectedRoute>
              <JobRecommendations />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Route - Only User Management */}
        <Route
          path="admin/users"
          element={
            <ProtectedRoute adminOnly>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect /admin to /admin/users */}
        <Route 
          path="admin" 
          element={<Navigate to="/admin/users" replace />} 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
