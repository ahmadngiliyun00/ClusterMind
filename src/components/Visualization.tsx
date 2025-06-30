import React, { useState } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { DataPoint } from '../utils/csv';
import { BarChart3, PieChart as PieChartIcon, Scatter as ScatterIcon, TrendingUp } from 'lucide-react';

interface VisualizationProps {
  data: DataPoint[];
  numericalColumns: string[];
}

const COLORS = [
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#6B7280', // Gray
];

const Visualization: React.FC<VisualizationProps> = ({ 
  data, 
  numericalColumns
}) => {
  const [activeChart, setActiveChart] = useState<'scatter' | 'bar' | 'pie'>('scatter');
  const [selectedDimensions, setSelectedDimensions] = useState<[string, string]>([
    numericalColumns[0] || '', 
    numericalColumns[1] || ''
  ]);

  if (!data || data.length === 0) return null;

  // Get all clusters
  const clusters = [...new Set(data.map(item => item.cluster))].sort((a, b) => a - b);
  
  // Prepare data for cluster sizes chart
  const clusterSizes = clusters.map(cluster => ({
    cluster: `Cluster ${cluster}`,
    size: data.filter(item => item.cluster === cluster).length,
    percentage: ((data.filter(item => item.cluster === cluster).length / data.length) * 100).toFixed(1)
  }));

  // Prepare data for pie chart
  const pieData = clusters.map((cluster, index) => ({
    name: `Cluster ${cluster}`,
    value: data.filter(item => item.cluster === cluster).length,
    color: COLORS[index % COLORS.length]
  }));

  // Calculate cluster statistics
  const clusterStats = clusters.map(cluster => {
    const clusterData = data.filter(item => item.cluster === cluster);
    const size = clusterData.length;
    const percentage = ((size / data.length) * 100).toFixed(1);
    
    // Calculate average values for numerical columns
    const avgValues: { [key: string]: number } = {};
    numericalColumns.forEach(col => {
      const values = clusterData.map(row => Number(row[col]) || 0);
      avgValues[col] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
      cluster,
      size,
      percentage,
      avgValues
    };
  });

  const renderCustomTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${selectedDimensions[0]}: ${Number(data[selectedDimensions[0]]).toFixed(3)}`}</p>
          <p className="font-medium">{`${selectedDimensions[1]}: ${Number(data[selectedDimensions[1]]).toFixed(3)}`}</p>
          <p className="text-sm text-gray-600">{`Cluster: ${data.cluster}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderPieTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{`${data.value} data points`}</p>
          <p className="text-sm text-gray-600">{`${((data.value / data.length) * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Visualisasi Cluster</h2>
        
        {/* Chart Type Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveChart('scatter')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'scatter'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ScatterIcon size={16} />
            Scatter Plot
          </button>
          <button
            onClick={() => setActiveChart('bar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'bar'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={16} />
            Bar Chart
          </button>
          <button
            onClick={() => setActiveChart('pie')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'pie'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PieChartIcon size={16} />
            Pie Chart
          </button>
        </div>
      </div>

      {/* Dimension Selector for Scatter Plot */}
      {activeChart === 'scatter' && numericalColumns.length >= 2 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Pilih Dimensi untuk Scatter Plot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sumbu X</label>
              <select
                value={selectedDimensions[0]}
                onChange={(e) => setSelectedDimensions([e.target.value, selectedDimensions[1]])}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {numericalColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sumbu Y</label>
              <select
                value={selectedDimensions[1]}
                onChange={(e) => setSelectedDimensions([selectedDimensions[0], e.target.value])}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {numericalColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chart Display */}
      <div className="mb-6">
        {activeChart === 'scatter' && numericalColumns.length >= 2 && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Scatter Plot: {selectedDimensions[0]} vs {selectedDimensions[1]}
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    dataKey={selectedDimensions[0]} 
                    name={selectedDimensions[0]} 
                    label={{ 
                      value: selectedDimensions[0],
                      position: 'insideBottom',
                      offset: -10
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey={selectedDimensions[1]} 
                    name={selectedDimensions[1]}
                    label={{
                      value: selectedDimensions[1],
                      angle: -90,
                      position: 'insideLeft'
                    }}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend />
                  
                  {clusters.map((cluster, index) => (
                    <Scatter
                      key={`cluster-${cluster}`}
                      name={`Cluster ${cluster}`}
                      data={data.filter(item => item.cluster === cluster)}
                      fill={COLORS[index % COLORS.length]}
                      shape="circle"
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'bar' && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Distribusi Ukuran Cluster</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterSizes} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="cluster" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} data points (${clusterSizes.find(c => c.size === value)?.percentage}%)`,
                      'Jumlah Data'
                    ]}
                  />
                  <Bar dataKey="size" name="Jumlah Data">
                    {clusterSizes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'pie' && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Proporsi Cluster</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percentage }) => `${name}: ${((value / data.length) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={renderPieTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Statistics */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center gap-2">
          <TrendingUp size={20} />
          Statistik Cluster
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusterStats.map((stat, index) => (
            <div key={stat.cluster} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <h4 className="font-medium text-gray-800">Cluster {stat.cluster}</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ukuran:</span>
                  <span className="font-medium">{stat.size} ({stat.percentage}%)</span>
                </div>
                
                {/* Show average values for first 3 numerical columns */}
                {numericalColumns.slice(0, 3).map(col => (
                  <div key={col} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{col}:</span>
                    <span className="font-medium ml-2">{stat.avgValues[col].toFixed(3)}</span>
                  </div>
                ))}
                
                {numericalColumns.length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    +{numericalColumns.length - 3} fitur lainnya
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Insights */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 Insights Visualisasi</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Scatter Plot:</strong> Menunjukkan distribusi spasial cluster dalam 2 dimensi</p>
          <p>• <strong>Bar Chart:</strong> Membandingkan ukuran relatif setiap cluster</p>
          <p>• <strong>Pie Chart:</strong> Menampilkan proporsi data dalam setiap cluster</p>
          <p>• <strong>Statistik:</strong> Rata-rata nilai fitur untuk setiap cluster</p>
        </div>
      </div>
    </div>
  );
};

export default Visualization;