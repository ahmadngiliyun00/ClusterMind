import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { DataPoint } from '../utils/csv';

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
  if (!data || data.length === 0) return null;

  // Get all clusters
  const clusters = [...new Set(data.map(item => item.cluster))].sort((a, b) => a - b);
  
  // Select first two numerical columns for scatter plot
  const scatterDimensions = numericalColumns.slice(0, 2);
  
  // Prepare data for cluster sizes chart
  const clusterSizes = clusters.map(cluster => ({
    cluster: `Cluster ${cluster}`,
    size: data.filter(item => item.cluster === cluster).length
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Visualisasi</h2>
      
      {/* Display Scatter Plot if we have at least 2 numerical columns */}
      {scatterDimensions.length >= 2 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-gray-700">Scatter Plot</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  type="number" 
                  dataKey={scatterDimensions[0]} 
                  name={scatterDimensions[0]} 
                  label={{ 
                    value: scatterDimensions[0],
                    position: 'insideBottom',
                    offset: -10
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey={scatterDimensions[1]} 
                  name={scatterDimensions[1]}
                  label={{
                    value: scatterDimensions[1],
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
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

      {/* Cluster Sizes */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-700">Ukuran Cluster</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={clusterSizes}
              margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="cluster" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="size" name="Jumlah Data" fill="#6D28D9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualization;