import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, RefreshCw, TrendingDown } from 'lucide-react';

interface ElbowAnalysisProps {
  wcssValues: number[];
  dbiValues: number[];
  onBack: () => void;
  onReset: () => void;
}

const ElbowAnalysis: React.FC<ElbowAnalysisProps> = ({ wcssValues, dbiValues, onBack, onReset }) => {
  // Prepare data for the charts
  const chartData = wcssValues.map((wcss, index) => ({
    k: index + 1,
    wcss: wcss,
    dbi: dbiValues[index] || 0,
    'WCSS': wcss,
    'Davies-Bouldin Index': dbiValues[index] || 0
  }));

  // Calculate elbow point for WCSS (simplified method)
  const calculateElbowPoint = (values: number[]) => {
    if (values.length < 3) return null;
    
    let maxDiff = 0;
    let elbowK = 2;
    
    for (let i = 1; i < values.length - 1; i++) {
      const diff1 = values[i - 1] - values[i];
      const diff2 = values[i] - values[i + 1];
      const totalDiff = diff1 - diff2;
      
      if (totalDiff > maxDiff) {
        maxDiff = totalDiff;
        elbowK = i + 1;
      }
    }
    
    return elbowK;
  };

  // Find optimal K for DBI (minimum value)
  const findOptimalDBI = (values: number[]) => {
    if (values.length < 2) return null;
    
    let minDBI = Infinity;
    let optimalK = 2;
    
    // Start from k=2 since DBI is undefined for k=1
    for (let i = 1; i < values.length; i++) {
      if (values[i] > 0 && values[i] < minDBI) {
        minDBI = values[i];
        optimalK = i + 1;
      }
    }
    
    return optimalK;
  };

  const suggestedWCSSK = calculateElbowPoint(wcssValues);
  const suggestedDBIK = findOptimalDBI(dbiValues);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 text-teal-700 p-2 rounded-full">
            <TrendingDown size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Analisis Metode Elbow</h2>
            <p className="text-gray-600 text-sm">
              Menentukan jumlah cluster optimal berdasarkan WCSS dan Davies-Bouldin Index
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {suggestedWCSSK && (
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-teal-500 text-white p-2 rounded-full">
                <TrendingDown size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-teal-800">Rekomendasi WCSS</h3>
                <p className="text-teal-700">
                  Berdasarkan Elbow Method: <span className="font-bold text-teal-900">K = {suggestedWCSSK}</span>
                </p>
                <p className="text-sm text-teal-600 mt-1">
                  Titik elbow pada grafik WCSS
                </p>
              </div>
            </div>
          </div>
        )}

        {suggestedDBIK && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 text-white p-2 rounded-full">
                <TrendingDown size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">Rekomendasi DBI</h3>
                <p className="text-purple-700">
                  Berdasarkan Davies-Bouldin Index: <span className="font-bold text-purple-900">K = {suggestedDBIK}</span>
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  Nilai DBI minimum
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* WCSS Chart */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700">Within-Cluster Sum of Squares (WCSS)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="k" 
                  label={{ 
                    value: 'Jumlah Cluster (K)',
                    position: 'insideBottom',
                    offset: -10
                  }}
                />
                <YAxis 
                  label={{
                    value: 'WCSS',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(3), 'WCSS']}
                  labelFormatter={(label) => `K = ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="WCSS" 
                  stroke="#0D9488" 
                  strokeWidth={3}
                  dot={{ fill: '#0D9488', r: 6 }}
                  activeDot={{ r: 8, fill: '#0F766E' }}
                />
                {/* Highlight suggested K */}
                {suggestedWCSSK && (
                  <Line
                    type="monotone"
                    dataKey="wcss"
                    stroke="transparent"
                    dot={(props: any) => {
                      if (props.payload.k === suggestedWCSSK) {
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={10}
                            fill="#EF4444"
                            stroke="#DC2626"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DBI Chart */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700">Davies-Bouldin Index</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.slice(1)} // Skip k=1 since DBI is undefined
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="k" 
                  label={{ 
                    value: 'Jumlah Cluster (K)',
                    position: 'insideBottom',
                    offset: -10
                  }}
                />
                <YAxis 
                  label={{
                    value: 'Davies-Bouldin Index',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(3), 'DBI']}
                  labelFormatter={(label) => `K = ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Davies-Bouldin Index" 
                  stroke="#7C3AED" 
                  strokeWidth={3}
                  dot={{ fill: '#7C3AED', r: 6 }}
                  activeDot={{ r: 8, fill: '#6D28D9' }}
                />
                {/* Highlight suggested K */}
                {suggestedDBIK && (
                  <Line
                    type="monotone"
                    dataKey="dbi"
                    stroke="transparent"
                    dot={(props: any) => {
                      if (props.payload.k === suggestedDBIK) {
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={10}
                            fill="#EF4444"
                            stroke="#DC2626"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-700">Data Metrik per Jumlah Cluster</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Cluster (K)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WCSS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Davies-Bouldin Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((row, index) => {
                const isWCSSRecommended = row.k === suggestedWCSSK;
                const isDBIRecommended = row.k === suggestedDBIK;
                
                return (
                  <tr key={row.k} className={
                    isWCSSRecommended || isDBIRecommended ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.k}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.wcss.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.k === 1 ? '-' : row.dbi.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {isWCSSRecommended && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                            WCSS Optimal
                          </span>
                        )}
                        {isDBIRecommended && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            DBI Optimal
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Cara Membaca Analisis:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-teal-700 mb-2">WCSS (Within-Cluster Sum of Squares)</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mengukur total jarak kuadrat dari setiap titik ke centroid cluster-nya</li>
              <li>• Semakin kecil semakin baik (cluster lebih kompak)</li>
              <li>• Titik elbow menunjukkan K optimal</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-purple-700 mb-2">Davies-Bouldin Index</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mengukur rasio within-cluster scatter terhadap between-cluster separation</li>
              <li>• Semakin kecil semakin baik (cluster lebih terpisah)</li>
              <li>• Nilai minimum menunjukkan K optimal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElbowAnalysis;