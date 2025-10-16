import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, 
  Code, Award, FolderGit2, Edit2, Save, X, Upload, Camera, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Resume sections editing state
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingEducation, setEditingEducation] = useState(false);
  const [editingExperience, setEditingExperience] = useState(false);
  const [editingProjects, setEditingProjects] = useState(false);
  const [editingAchievements, setEditingAchievements] = useState(false);
  
  // Resume sections data
  const [skillsData, setSkillsData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [experienceData, setExperienceData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [achievementsData, setAchievementsData] = useState([]);

  useEffect(() => {
    // Try to load from localStorage first for instant display
    const cachedProfile = localStorage.getItem('profileData');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setProfileData(parsed);
        setFormData({
          name: parsed.profile?.name || '',
          email: parsed.email || '',
          phone: parsed.profile?.phone || '',
          location: parsed.profile?.location || '',
          dateOfBirth: parsed.profile?.dateOfBirth ? parsed.profile.dateOfBirth.split('T')[0] : '',
          age: parsed.profile?.age || '',
          gender: parsed.profile?.gender || '',
          bio: parsed.profile?.bio || '',
          website: parsed.profile?.website || '',
          linkedin: parsed.profile?.linkedin || '',
          github: parsed.profile?.github || ''
        });
        
        // Initialize resume data
        setSkillsData(parsed.profile?.skills || []);
        setEducationData(parsed.profile?.education || []);
        setExperienceData(parsed.profile?.experience || []);
        setProjectsData(parsed.profile?.projects || []);
        setAchievementsData(parsed.profile?.achievements || []);
      } catch (e) {
        console.error('Failed to parse cached profile:', e);
      }
    }
    
    // Then fetch fresh data from API
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProfileData(data.data);
        
        // Store in localStorage for persistence
        localStorage.setItem('profileData', JSON.stringify(data.data));
        
        setFormData({
          name: data.data.profile?.name || '',
          email: data.data.email || '',
          phone: data.data.profile?.phone || '',
          location: data.data.profile?.location || '',
          dateOfBirth: data.data.profile?.dateOfBirth ? data.data.profile.dateOfBirth.split('T')[0] : '',
          age: data.data.profile?.age || '',
          gender: data.data.profile?.gender || '',
          bio: data.data.profile?.bio || '',
          website: data.data.profile?.website || '',
          linkedin: data.data.profile?.linkedin || '',
          github: data.data.profile?.github || ''
        });
        
        // Set resume data
        setSkillsData(data.data.profile?.skills || []);
        setEducationData(data.data.profile?.education || []);
        setExperienceData(data.data.profile?.experience || []);
        setProjectsData(data.data.profile?.projects || []);
        setAchievementsData(data.data.profile?.achievements || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Resume sections save functions
  const saveResumeSection = async (sectionName, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [`profile.${sectionName}`]: data
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: `${sectionName} updated successfully!` });
        // Update localStorage
        const currentProfile = JSON.parse(localStorage.getItem('profileData') || '{}');
        currentProfile.profile = currentProfile.profile || {};
        currentProfile.profile[sectionName] = data;
        localStorage.setItem('profileData', JSON.stringify(currentProfile));
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return true;
      } else {
        setMessage({ type: 'error', text: result.message || `Failed to update ${sectionName}` });
        return false;
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to update ${sectionName}` });
      return false;
    }
  };

  // Skills management
  const addSkill = () => {
    setSkillsData([...skillsData, '']);
  };

  const updateSkill = (index, value) => {
    const updated = [...skillsData];
    updated[index] = value;
    setSkillsData(updated);
  };

  const removeSkill = (index) => {
    setSkillsData(skillsData.filter((_, i) => i !== index));
  };

  const saveSkills = async () => {
    const filtered = skillsData.filter(skill => skill.trim() !== '');
    const success = await saveResumeSection('skills', filtered);
    if (success) {
      setSkillsData(filtered);
      setEditingSkills(false);
    }
  };

  // Education management
  const addEducation = () => {
    setEducationData([...educationData, { degree: '', institution: '', year: '', details: '' }]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...educationData];
    updated[index][field] = value;
    setEducationData(updated);
  };

  const removeEducation = (index) => {
    setEducationData(educationData.filter((_, i) => i !== index));
  };

  const saveEducation = async () => {
    const filtered = educationData.filter(edu => edu.degree.trim() !== '' || edu.institution.trim() !== '');
    const success = await saveResumeSection('education', filtered);
    if (success) {
      setEducationData(filtered);
      setEditingEducation(false);
    }
  };

  // Experience management
  const addExperience = () => {
    setExperienceData([...experienceData, { title: '', company: '', duration: '', responsibilities: [''] }]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experienceData];
    if (field === 'responsibilities') {
      updated[index][field] = value;
    } else {
      updated[index][field] = value;
    }
    setExperienceData(updated);
  };

  const removeExperience = (index) => {
    setExperienceData(experienceData.filter((_, i) => i !== index));
  };

  const saveExperience = async () => {
    const filtered = experienceData.filter(exp => exp.title.trim() !== '' || exp.company.trim() !== '');
    const success = await saveResumeSection('experience', filtered);
    if (success) {
      setExperienceData(filtered);
      setEditingExperience(false);
    }
  };

  // Projects management
  const addProject = () => {
    setProjectsData([...projectsData, { name: '', description: '', technologies: [''] }]);
  };

  const updateProject = (index, field, value) => {
    const updated = [...projectsData];
    updated[index][field] = value;
    setProjectsData(updated);
  };

  const removeProject = (index) => {
    setProjectsData(projectsData.filter((_, i) => i !== index));
  };

  const saveProjects = async () => {
    const filtered = projectsData.filter(proj => proj.name.trim() !== '');
    const success = await saveResumeSection('projects', filtered);
    if (success) {
      setProjectsData(filtered);
      setEditingProjects(false);
    }
  };

  // Achievements management
  const addAchievement = () => {
    setAchievementsData([...achievementsData, '']);
  };

  const updateAchievement = (index, value) => {
    const updated = [...achievementsData];
    updated[index] = value;
    setAchievementsData(updated);
  };

  const removeAchievement = (index) => {
    setAchievementsData(achievementsData.filter((_, i) => i !== index));
  };

  const saveAchievements = async () => {
    const filtered = achievementsData.filter(achievement => achievement.trim() !== '');
    const success = await saveResumeSection('achievements', filtered);
    if (success) {
      setAchievementsData(filtered);
      setEditingAchievements(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
        setProfileData(data.data);
        
        // Update localStorage immediately
        localStorage.setItem('profileData', JSON.stringify(data.data));
        
        // Also update the user in AuthContext if name changed
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (formData.name && formData.name !== currentUser.name) {
          const updatedUser = { ...currentUser, name: formData.name };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {profileData?.profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profileData?.profile?.name || 'Your Profile'}
                </h1>
                <p className="text-gray-600">{profileData?.email}</p>
                <p className="text-sm text-gray-500 capitalize">{profileData?.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/resume-analyzer')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Resume
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      fetchProfile();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData?.profile?.name && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{profileData.profile.name}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profileData.email}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.profile?.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{profileData.profile.phone}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.profile?.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{profileData.profile.location}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.profile?.dateOfBirth && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="font-medium text-gray-900">{new Date(profileData.profile.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.profile?.age && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-medium text-gray-900">{profileData.profile.age} years</p>
                      </div>
                    </div>
                  )}
                  {profileData?.profile?.gender && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="font-medium text-gray-900 capitalize">{profileData.profile.gender}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Social Links</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {profileData?.profile?.website && (
                    <a href={profileData.profile.website} target="_blank" rel="noopener noreferrer" 
                       className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-blue-600 hover:underline">🌐 {profileData.profile.website}</p>
                    </a>
                  )}
                  {profileData?.profile?.linkedin && (
                    <a href={profileData.profile.linkedin} target="_blank" rel="noopener noreferrer"
                       className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-blue-600 hover:underline">💼 LinkedIn Profile</p>
                    </a>
                  )}
                  {profileData?.profile?.github && (
                    <a href={profileData.profile.github} target="_blank" rel="noopener noreferrer"
                       className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-blue-600 hover:underline">💻 GitHub Profile</p>
                    </a>
                  )}
                  {!profileData?.profile?.website && !profileData?.profile?.linkedin && !profileData?.profile?.github && (
                    <p className="text-sm text-gray-500 italic">No social links added</p>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About Me</h3>
              
              {editing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a brief bio about yourself..."
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              ) : (
                <p className="text-gray-700">
                  {profileData?.profile?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Resume Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  Skills ({skillsData.length})
                </h3>
                {!editingSkills ? (
                  <button
                    onClick={() => setEditingSkills(true)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveSkills}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingSkills(false);
                        setSkillsData(profileData?.profile?.skills || []);
                      }}
                      className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingSkills ? (
                <div className="space-y-3">
                  {skillsData.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkill(index, e.target.value)}
                        placeholder="Enter skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSkill}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Skill
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillsData.length > 0 ? (
                    skillsData.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-800 rounded-full text-sm font-medium hover:shadow-md transition-shadow"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No skills added yet. Click "Edit" to add skills.</p>
                  )}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  Education ({educationData.length})
                </h3>
                {!editingEducation ? (
                  <button
                    onClick={() => setEditingEducation(true)}
                    className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveEducation}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingEducation(false);
                        setEducationData(profileData?.profile?.education || []);
                      }}
                      className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingEducation ? (
                <div className="space-y-4">
                  {educationData.map((edu, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Education {index + 1}</h4>
                        <button
                          onClick={() => removeEducation(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Degree/Course"
                          value={edu.degree || ''}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Institution/University"
                          value={edu.institution || ''}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Year (e.g., 2020-2024)"
                        value={edu.year || ''}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Additional details (optional)"
                        value={edu.details || ''}
                        onChange={(e) => updateEducation(index, 'details', e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addEducation}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Education
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {educationData.length > 0 ? (
                    educationData.map((edu, index) => (
                      <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                        <p className="text-gray-700 font-medium">{edu.institution}</p>
                        <p className="text-sm text-gray-600">{edu.year}</p>
                        {edu.details && <p className="text-sm text-gray-600 mt-2">{edu.details}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No education added yet. Click "Edit" to add education.</p>
                  )}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Work Experience ({experienceData.length})
                </h3>
                {!editingExperience ? (
                  <button
                    onClick={() => setEditingExperience(true)}
                    className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveExperience}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingExperience(false);
                        setExperienceData(profileData?.profile?.experience || []);
                      }}
                      className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingExperience ? (
                <div className="space-y-4">
                  {experienceData.map((exp, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Experience {index + 1}</h4>
                        <button
                          onClick={() => removeExperience(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={exp.title || ''}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={exp.company || ''}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                        value={exp.duration || ''}
                        onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities (one per line)</label>
                        <textarea
                          placeholder="• Managed team of 5 developers&#10;• Increased system performance by 40%&#10;• Led project delivery on time"
                          value={exp.responsibilities ? exp.responsibilities.join('\n') : ''}
                          onChange={(e) => updateExperience(index, 'responsibilities', e.target.value.split('\n').filter(r => r.trim()))}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addExperience}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Experience
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {experienceData.length > 0 ? (
                    experienceData.map((exp, index) => (
                      <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-bold text-gray-900">{exp.title}</h4>
                        <p className="text-gray-700 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-600 mb-2">{exp.duration}</p>
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {exp.responsibilities.map((resp, idx) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No work experience added yet. Click "Edit" to add experience.</p>
                  )}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-orange-600" />
                  Projects ({projectsData.length})
                </h3>
                {!editingProjects ? (
                  <button
                    onClick={() => setEditingProjects(true)}
                    className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveProjects}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingProjects(false);
                        setProjectsData(profileData?.profile?.projects || []);
                      }}
                      className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingProjects ? (
                <div className="space-y-4">
                  {projectsData.map((project, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Project {index + 1}</h4>
                        <button
                          onClick={() => removeProject(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={project.name || ''}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Project Description"
                        value={project.description || ''}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Technologies (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="React, Node.js, MongoDB, Express"
                          value={project.technologies ? project.technologies.join(', ') : ''}
                          onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addProject}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Project
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectsData.length > 0 ? (
                    projectsData.map((project, index) => (
                      <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-bold text-gray-900">{project.name}</h4>
                        <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.technologies.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No projects added yet. Click "Edit" to add projects.</p>
                  )}
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements & Certifications ({achievementsData.length})
                </h3>
                {!editingAchievements ? (
                  <button
                    onClick={() => setEditingAchievements(true)}
                    className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveAchievements}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingAchievements(false);
                        setAchievementsData(profileData?.profile?.achievements || []);
                      }}
                      className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingAchievements ? (
                <div className="space-y-3">
                  {achievementsData.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        placeholder="Enter achievement or certification"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeAchievement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAchievement}
                    className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Achievement
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {achievementsData.length > 0 ? (
                    achievementsData.map((achievement, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{achievement}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No achievements added yet. Click "Edit" to add achievements.</p>
                  )}
                </div>
              )}
            </div>

            {/* Empty State */}
            {(!profileData?.profile?.skills || profileData.profile.skills.length === 0) &&
             (!profileData?.profile?.education || profileData.profile.education.length === 0) &&
             (!profileData?.profile?.experience || profileData.profile.experience.length === 0) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Resume Data Yet</h3>
                <p className="text-gray-600 mb-6">
                  Upload your resume to automatically extract skills, education, experience, and more!
                </p>
                <button
                  onClick={() => navigate('/resume-analyzer')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Upload Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
