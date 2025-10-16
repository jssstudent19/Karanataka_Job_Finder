import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { KARNATAKA_CITIES } from '../../constants/cities';
import { JobRecommendationFormData } from '../../types/jobRecommendation';

interface InputFormProps {
  initialData: JobRecommendationFormData;
  onSubmit: (data: JobRecommendationFormData) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading 
}) => {
  const [formData, setFormData] = useState<JobRecommendationFormData>(initialData);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_of_experience' 
        ? (value === '' ? 0 : parseInt(value, 10)) 
        : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setFormData(prev => ({ ...prev, resume_file: file }));
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, resume_file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }
      setFormData(prev => ({ ...prev, resume_file: file }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume_file) {
      alert('Please upload your resume in PDF format.');
      return;
    }
    if (!formData.job_position.trim()) {
      alert('Please enter a job position.');
      return;
    }
    onSubmit(formData);
  };

  const getFileIcon = () => '📄';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Job Recommendation Setup</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Job Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="job_position"
              value={formData.job_position}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Senior Frontend Engineer"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="years_of_experience"
              value={formData.years_of_experience}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 5"
              min="0"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            City in Karnataka <span className="text-red-500">*</span>
          </label>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {KARNATAKA_CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Upload Resume (PDF) <span className="text-red-500">*</span>
          </label>
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : formData.resume_file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
            }`}
            onClick={triggerFileInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {formData.resume_file ? (
              <div className="space-y-3">
                <div className="text-4xl">{getFileIcon()}</div>
                <div>
                  <h3 className="text-lg font-bold text-green-700">File Selected</h3>
                  <p className="text-green-600">{formData.resume_file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(formData.resume_file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <X className="h-4 w-4" />
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-gray-700">Upload Resume</h3>
                  <p className="text-gray-500">
                    Drag and drop your resume or click to browse
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    PDF format required (Max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !formData.resume_file}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating AI Job Prompt...
              </>
            ) : (
              'Generate Job Search Prompt'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};