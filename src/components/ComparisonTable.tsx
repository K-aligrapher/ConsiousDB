import { ArrowRight, TrendingDown } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ComparisonTableProps {
  analysis: AnalysisResult;
}

export function ComparisonTable({ analysis }: ComparisonTableProps) {
  const metrics = [
    {
      label: 'Execution Time',
      original: analysis.original.execution_time_s.toFixed(3),
      optimized: analysis.optimized.execution_time_s.toFixed(3),
      unit: 's',
      savings: analysis.savings.time_percent
    },
    {
      label: 'Energy Consumption',
      original: analysis.original.energy_joules.toFixed(2),
      optimized: analysis.optimized.energy_joules.toFixed(2),
      unit: 'J',
      savings: analysis.savings.energy_percent
    },
    {
      label: 'CO₂ Emissions',
      original: analysis.original.co2_emissions_g.toFixed(4),
      optimized: analysis.optimized.co2_emissions_g.toFixed(4),
      unit: 'g CO₂',
      savings: analysis.savings.co2_percent
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-green-600" />
          Performance Comparison
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Optimized
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Savings
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {metric.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                  {metric.original} <span className="text-gray-500">{metric.unit}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-green-600 font-semibold">
                  {metric.optimized} <span className="text-gray-500">{metric.unit}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    -{metric.savings.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
