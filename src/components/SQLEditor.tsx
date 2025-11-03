import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface SQLEditorProps {
  onExecute: (query: string) => Promise<void>;
  isLoading: boolean;
}

export function SQLEditor({ onExecute, isLoading }: SQLEditorProps) {
  const [query, setQuery] = useState(`SELECT *
FROM sales_records sr
JOIN customers c ON sr.customer_id = c.id
WHERE c.registration_date > '2023-01-01'
ORDER BY sr.sale_amount DESC;`);

  const handleExecute = () => {
    if (query.trim()) {
      onExecute(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newValue);
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="ml-2 text-sm font-medium text-gray-700">SQL Editor</span>
        </div>
        <button
          onClick={handleExecute}
          disabled={isLoading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Analyze Query
            </>
          )}
        </button>
      </div>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-4 font-mono text-sm resize-none focus:outline-none min-h-[300px] bg-gray-50"
        placeholder="Enter your SQL query here..."
        spellCheck={false}
      />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Press Cmd/Ctrl + Enter to analyze
      </div>
    </div>
  );
}
