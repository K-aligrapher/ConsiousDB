import { useState, useEffect } from 'react';
import { Clock, Zap, Leaf, Activity, Leaf as LeafIcon } from 'lucide-react';
import { SQLEditor } from './components/SQLEditor';
import { MetricsCard } from './components/MetricsCard';
import { ComparisonTable } from './components/ComparisonTable';
import { OptimizationSuggestions } from './components/OptimizationSuggestions';
import { DatabaseManager } from './components/DatabaseManager';
import { HistoryPanel } from './components/HistoryPanel';
import { supabase } from './lib/supabase';
import { Database, AnalysisResult } from './types';

function App() {
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      (async () => {
        await checkAuth();
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (!user) {
      await supabase.auth.signInAnonymously();
    }
  };

  const analyzeQuery = async (query: string) => {
    if (!selectedDatabase) {
      alert('Please select or create a database first');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-query`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze query');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      await supabase.from('query_analyses').insert([{
        database_id: selectedDatabase.id,
        original_query: result.original.query,
        optimized_query: result.optimized.query,
        cpu_cost: result.original.cpu_cost,
        io_cost: result.original.io_cost,
        execution_time_s: result.original.execution_time_s,
        energy_joules: result.original.energy_joules,
        co2_emissions_g: result.original.co2_emissions_g,
        optimized_energy_joules: result.optimized.energy_joules,
        optimized_co2_emissions_g: result.optimized.co2_emissions_g,
        optimization_suggestions: result.suggestions
      }]);

      setHistoryRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error analyzing query:', error);
      alert('Failed to analyze query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                <LeafIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ConsciousDB</h1>
                <p className="text-sm text-gray-600">Energy-Aware SQL Query Analyzer</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500">Environment Impact</div>
                <div className="text-sm font-semibold text-green-600">Monitoring Active</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <DatabaseManager
              onDatabaseSelect={setSelectedDatabase}
              selectedDatabase={selectedDatabase}
            />
          </div>

          <div className="col-span-6 space-y-6">
            <SQLEditor onExecute={analyzeQuery} isLoading={isLoading} />

            {analysisResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <MetricsCard
                    title="Execution Time"
                    value={analysisResult.original.execution_time_s.toFixed(3)}
                    unit="seconds"
                    icon={Clock}
                    color="blue"
                    change={analysisResult.savings.time_percent}
                  />
                  <MetricsCard
                    title="Energy Consumption"
                    value={analysisResult.original.energy_joules.toFixed(2)}
                    unit="joules"
                    icon={Zap}
                    color="orange"
                    change={analysisResult.savings.energy_percent}
                  />
                  <MetricsCard
                    title="Carbon Emissions"
                    value={analysisResult.original.co2_emissions_g.toFixed(4)}
                    unit="g CO₂"
                    icon={Leaf}
                    color="green"
                    change={analysisResult.savings.co2_percent}
                  />
                </div>

                <ComparisonTable analysis={analysisResult} />

                <OptimizationSuggestions
                  suggestions={analysisResult.suggestions}
                  optimizedQuery={analysisResult.optimized.query}
                />
              </>
            )}

            {!analysisResult && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Write your SQL query above and click "Analyze Query" to see energy consumption metrics and optimization suggestions.
                </p>
              </div>
            )}
          </div>

          <div className="col-span-3">
            <HistoryPanel
              databaseId={selectedDatabase?.id || null}
              onSelectQuery={(query) => {
                analyzeQuery(query);
              }}
              refreshTrigger={historyRefresh}
            />
          </div>
        </div>
      </main>

      <footer className="max-w-[1800px] mx-auto px-6 py-4 mt-8">
        <div className="text-center text-sm text-gray-500">
          <p>ConsciousDB helps you write more efficient, environmentally-friendly SQL queries</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
