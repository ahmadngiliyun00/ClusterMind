import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, RefreshCw, TrendingDown } from 'lucide-react';

interface ElbowAnalysisProps {
  inertiaValues: number[];
  onBack: () => void;
  onReset: () => void;
}

const ElbowAnalysis: React.FC<ElbowAnalysisProps> = ({ inertiaValues, onBack, onReset }) => {
  // Prepare data for the chart
  const chartData = inertiaValues.map((inertia, index) => ({
    k: index + 1,
    inertia: inertia,
    'Within-Cluster Sum of Squares': inertia
  }));

  // Calculate elbow point (simplified method)
  const calculateElbowPoint = () => {
    if (inertiaValues.length < 3) return null;
    
    let maxDiff = 0;
    let elbowK = 2;
    
    for (let i = 1; i < inertiaValues.length - 1; i++) {
      const diff1 = inertiaValues[i - 1] - inertiaValues[i];
      const diff2 = inertiaValues[i] - inertiaValues[i + 1];
      const totalDiff = diff1 - diff2;
      
      if (totalDiff > maxDiff) {
        maxDiff = totalDiff;
        elbowK = i + 1;
      }
    }
    
    return elbowK;
  };

  const suggestedK = calculateElbowPoint();

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
              Menentukan jumlah cluster optimal berdasarkan Within-Cluster Sum of Squares (WCSS)
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

      {/* Recommendation */}
      {suggestedK && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-white p-2 rounded-full">
              <TrendingDown size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-teal-800">Rekomendasi Jumlah Cluster</h3>
              <p className="text-teal-700">
                Berdasarkan analisis Elbow Method, jumlah cluster optimal yang disarankan adalah{' '}
                <span className="font-bold text-teal-900">K = {suggestedK}</span>
              </p>
              <p className="text-sm text-teal-600 mt-1">
                Titik ini menunjukkan penurunan signifikan dalam WCSS sebelum kurva mulai mendatar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 text-gray-700">Grafik Elbow Method</h3>
        <div className="h-96">
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
                  value: 'Within-Cluster Sum of Squares (WCSS)',
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(4), 'WCSS']}
                labelFormatter={(label) => `K = ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Within-Cluster Sum of Squares" 
                stroke="#0D9488" 
                strokeWidth={3}
                dot={{ fill: '#0D9488', r: 6 }}
                activeDot={{ r: 8, fill: '#0F766E' }}
              />
              {/* Highlight suggested K */}
              {suggestedK && (
                <Line
                  type="monotone"
                  dataKey="inertia"
                  stroke="transparent"
                  dot={(props: any) => {
                    if (props.payload.k === suggestedK) {
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

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-700">Data WCSS per Jumlah Cluster</h3>
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
                  Penurunan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((row, index) => {
                const decrease = index > 0 ? chartData[index - 1].inertia - row.inertia : 0;
                const isRecommended = row.k === suggestedK;
                
                return (
                  <tr key={row.k} className={isRecommended ? 'bg-teal-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.k}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.inertia.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index > 0 ? decrease.toFixed(4) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isRecommended && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                          Disarankan
                        </span>
                      )}
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
        <h4 className="font-medium text-gray-800 mb-2">Cara Membaca Grafik Elbow:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Sumbu X:</strong> Jumlah cluster (K)</li>
          <li>• <strong>Sumbu Y:</strong> Within-Cluster Sum of Squares (WCSS) - total jarak kuadrat dari setiap titik ke centroid cluster-nya</li>
          <li>• <strong>Titik Elbow:</strong> Titik di mana penurunan WCSS mulai melambat secara signifikan</li>
          <li>• <strong>Interpretasi:</strong> Jumlah cluster optimal biasanya berada di titik elbow, di mana penambahan cluster tidak memberikan perbaikan yang signifikan</li>
        </ul>
      </div>
    </div>
  );
};

export default ElbowAnalysis;