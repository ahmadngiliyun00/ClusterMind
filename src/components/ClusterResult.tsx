import React, { useState } from 'react';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { downloadCSV } from '../utils/csv';
import { DataPoint } from '../utils/csv';

interface ClusterResultProps {
  data: DataPoint[];
  headers: string[];
  onReset: () => void;
}

const ClusterResult: React.FC<ClusterResultProps> = ({ data, headers, onReset }) => {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  if (!data || data.length === 0) {
    return null;
  }

  const clusters = [...new Set(data.map((point) => point.cluster))].sort(
    (a, b) => (a || 0) - (b || 0)
  );
  
  const filteredData = selectedCluster !== null 
    ? data.filter((point) => point.cluster === selectedCluster)
    : data;
    
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const displayData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // Calculate how many items are in each cluster
  const clusterCounts = clusters.reduce<Record<number, number>>((acc, cluster) => {
    acc[cluster] = data.filter(point => point.cluster === cluster).length;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Hasil Clustering</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadCSV(data, 'clustermind_hasil.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <RefreshCw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Filter size={16} className="mr-1" /> Filter Cluster:
          </span>
          
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedCluster === null
                ? 'bg-indigo-100 text-indigo-800 font-medium'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCluster(null)}
          >
            Semua ({data.length})
          </button>
          
          {clusters.map((cluster) => (
            <button
              key={cluster}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedCluster === cluster
                  ? 'bg-indigo-100 text-indigo-800 font-medium'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCluster(cluster)}
            >
              Cluster {cluster} ({clusterCounts[cluster] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.slice(0, 5).map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cluster
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {headers.slice(0, 5).map((header) => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[header]?.toString() || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800`}>
                    Cluster {row.cluster}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} dari {filteredData.length} hasil
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              &laquo; Prev
            </button>
            
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterResult;