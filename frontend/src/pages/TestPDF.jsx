import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function TestPDF() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const testPDFExtraction = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setTesting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/test-pdf/extract-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to extract text');
      }
    } catch (err) {
      console.error('PDF test error:', err);
      setError('Network error or server unavailable');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF Text Extraction Test
          </h1>
          <p className="text-gray-600">
            Test if we can properly extract text from your PDF/DOC files
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </button>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Select File to Test
          </h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {selectedFile && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={testPDFExtraction}
              disabled={!selectedFile || testing}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Testing...
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  Test Text Extraction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">Extraction Failed</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Extraction Successful!</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">File Name</p>
                <p className="font-medium">{result.filename}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">File Type</p>
                <p className="font-medium">{result.mimetype}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">File Size</p>
                <p className="font-medium">{(result.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Extracted Text Length</p>
                <p className="font-medium">{result.extractedTextLength} characters</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Preview (first 500 characters):</p>
              <div className="bg-gray-50 p-4 rounded border max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {result.preview}
                </pre>
              </div>
            </div>

            <div className="mt-4 bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Full Extracted Text:</p>
              <div className="bg-gray-50 p-4 rounded border max-h-60 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {result.extractedText}
                </pre>
              </div>
            </div>

            {result.extractedTextLength > 100 && (
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <p className="text-blue-800 font-medium">
                  ✅ Text extraction successful! The PDF parser is working correctly.
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  This text can now be sent to AI for analysis.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
          <h3 className="font-bold text-amber-900 mb-2">How to Test:</h3>
          <ol className="text-amber-800 text-sm space-y-1">
            <li>1. Select a PDF, DOC, DOCX, or TXT file</li>
            <li>2. Click "Test Text Extraction"</li>
            <li>3. Check if the extracted text looks correct</li>
            <li>4. If successful, the ATS scanner should work with this file</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
