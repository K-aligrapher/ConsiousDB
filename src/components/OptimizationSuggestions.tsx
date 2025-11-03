import { Lightbulb, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface OptimizationSuggestionsProps {
  suggestions: string;
  optimizedQuery: string;
}

export function OptimizationSuggestions({ suggestions, optimizedQuery }: OptimizationSuggestionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimizedQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestionList = suggestions.split('.').filter(s => s.trim());

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-sm border border-yellow-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimization Recommendations</h3>
            <ul className="space-y-2">
              {suggestionList.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>{suggestion.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Optimized Query</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-800">{optimizedQuery}</code>
        </pre>
      </div>
    </div>
  );
}
