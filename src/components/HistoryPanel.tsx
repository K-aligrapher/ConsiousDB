import { useState, useEffect } from 'react';
import { History, Trash2, Clock, Zap, Leaf } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QueryAnalysis } from '../types';

interface HistoryPanelProps {
  databaseId: string | null;
  onSelectQuery: (query: string) => void;
  refreshTrigger: number;
}

export function HistoryPanel({ databaseId, onSelectQuery, refreshTrigger }: HistoryPanelProps) {
  const [analyses, setAnalyses] = useState<QueryAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (databaseId) {
      loadAnalyses();
    } else {
      setAnalyses([]);
    }
  }, [databaseId, refreshTrigger]);

  const loadAnalyses = async () => {
    if (!databaseId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('query_analyses')
      .select('*')
      .eq('database_id', databaseId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && !error) {
      setAnalyses(data);
    }
    setIsLoading(false);
  };

  const deleteAnalysis = async (id: string) => {
    await supabase.from('query_analyses').delete().eq('id', id);
    setAnalyses(analyses.filter(a => a.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!databaseId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Select a database to view query history</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white flex items-center gap-2">
        <History className="w-5 h-5" />
        <h2 className="font-semibold">Query History</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No query analyses yet</p>
          </div>
        ) : (
          analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onSelectQuery(analysis.original_query)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(analysis.created_at)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnalysis(analysis.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <pre className="text-xs font-mono text-gray-700 mb-3 line-clamp-3 overflow-hidden">
                {analysis.original_query}
              </pre>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 rounded px-2 py-1">
                  <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">Time</span>
                  </div>
                  <div className="font-mono text-gray-700">
                    {analysis.execution_time_s.toFixed(3)}s
                  </div>
                </div>

                <div className="bg-orange-50 rounded px-2 py-1">
                  <div className="flex items-center gap-1 text-orange-600 mb-0.5">
                    <Zap className="w-3 h-3" />
                    <span className="font-medium">Energy</span>
                  </div>
                  <div className="font-mono text-gray-700">
                    {analysis.energy_joules.toFixed(1)}J
                  </div>
                </div>

                <div className="bg-green-50 rounded px-2 py-1">
                  <div className="flex items-center gap-1 text-green-600 mb-0.5">
                    <Leaf className="w-3 h-3" />
                    <span className="font-medium">CO₂</span>
                  </div>
                  <div className="font-mono text-gray-700">
                    {analysis.co2_emissions_g.toFixed(4)}g
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
