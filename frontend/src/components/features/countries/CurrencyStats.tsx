//frontend/src/components/features/countries/CurrencyStats.tsx
import { Country } from '@/hooks/useCountries';
import { TrendingUp } from 'lucide-react';

interface CurrencyStatsProps {
  countries: Country[];
}

// Helper function to safely convert exchange_rate
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

export function CurrencyStats({ countries }: CurrencyStatsProps) {
  // Use safe function for all calculations
  const rates = countries.map(c => safeNumber(c.exchange_rate));
  const highestRate = rates.length > 0 ? Math.max(...rates) : 0;
  const lowestRate = rates.length > 0 ? Math.min(...rates) : 0;
  const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Exchange Rate Summary vs USD
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">Highest Rate</p>
          <p className="text-2xl font-bold text-blue-900">{highestRate.toFixed(4)}</p>
          <p className="text-xs text-blue-600 mt-1">
            {countries.find(c => safeNumber(c.exchange_rate) === highestRate)?.name || 'N/A'}
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Average Rate</p>
          <p className="text-2xl font-bold text-green-900">{averageRate.toFixed(4)}</p>
          <p className="text-xs text-green-600 mt-1">Average of {countries.length} countries</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm font-medium text-orange-800">Lowest Rate</p>
          <p className="text-2xl font-bold text-orange-900">{lowestRate.toFixed(4)}</p>
          <p className="text-xs text-orange-600 mt-1">
            {countries.find(c => safeNumber(c.exchange_rate) === lowestRate)?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Simplified rate table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Rates by Country</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {countries.map((country) => (
            <div key={country.code} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{country.name}</span>
              <span className="text-sm font-medium text-gray-900">
                {safeNumber(country.exchange_rate).toFixed(4)} {country.currency_code}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}