import React, { useState } from 'react';
import { Copy, Check, Brain, Loader2, RefreshCw } from 'lucide-react';
import { GeneratedPromptData } from '../../types/jobRecommendation';

interface GeneratedPromptProps {
  promptData: GeneratedPromptData | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
}

export const GeneratedPrompt: React.FC<GeneratedPromptProps> = ({ 
  promptData, 
  isLoading, 
  error, 
  onReset 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (promptData?.prompt) {
      try {
        await navigator.clipboard.writeText(promptData.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = promptData.prompt;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed: ', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Analyzing your resume with AI...
          </h3>
          <p className="text-gray-600">
            This may take 1-2 minutes to extract skills and generate your personalized job search prompt.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          {onReset && (
            <button
              onClick={onReset}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Brain className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Your AI Job Search Prompt Will Appear Here
          </h3>
          <p className="text-gray-500">
            Complete the form on the left to generate your personalized job search prompt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Job Search Prompt</h2>
        </div>
        <div className="flex items-center gap-3">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Search
            </button>
          )}
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Prompt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Skills */}
      {promptData.skills && promptData.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Extracted Skills from Resume:</h3>
          <div className="flex flex-wrap gap-2">
            {promptData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Processing Time */}
      {promptData.processingTime && (
        <div className="text-sm text-gray-500 mb-4">
          Generated in {promptData.processingTime}
        </div>
      )}

      {/* Generated Prompt */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Your Personalized Job Search Prompt:</h3>
          <div className="text-sm text-gray-500">
            {promptData.prompt.length} characters
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
            {promptData.prompt}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">How to Use This Prompt:</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Copy the prompt above using the "Copy Prompt" button</li>
          <li>Paste it into your preferred AI assistant (Gemini, ChatGPT, Claude, etc.)</li>
          <li>The AI will search and analyze job postings to find matches for your profile</li>
          <li>Review the results and apply to jobs that interest you</li>
        </ol>
      </div>
    </div>
  );
};