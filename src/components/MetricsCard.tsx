import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  color: string;
  change?: number;
}

export function MetricsCard({ title, value, unit, icon: Icon, color, change }: MetricsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs optimized
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
