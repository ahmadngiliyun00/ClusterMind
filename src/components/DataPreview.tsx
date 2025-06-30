import React, { useState } from 'react';
import { Eye, EyeOff, Database, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { DataPoint } from '../utils/csv';

interface DataPreviewProps {
  data: DataPoint[];
  headers: string[];
  title: string;
  description: string;
  numericalColumns: string[];
  categoricalColumns: string[];
  onNext?: () => void;
  onPrevious?: () => void;
  nextButtonText?: string;
  showNextButton?: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  headers,
  title,
  description,
  numericalColumns,
  categoricalColumns,
  onNext,
  onPrevious,
  nextButtonText = "Lanjutkan",
  showNextButton = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayData = data.slice(startIndex, startIndex + rowsPerPage);

  const getColumnType = (header: string) => {
    if (numericalColumns.includes(header)) return 'numerical';
    if (categoricalColumns.includes(header)) return 'categorical';
    return 'other';
  };

  const getColumnBadge = (header: string) => {
    const type = getColumnType(header);
    switch (type) {
      case 'numerical':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Numerik</span>;
      case 'categorical':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Kategorikal</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Lainnya</span>;
    }
  };

  // Analyze cardinality for categorical columns
  const analyzeCardinality = () => {
    const cardinalityInfo: { [column: string]: { count: number; isHighCardinality: boolean } } = {};
    
    categoricalColumns.forEach(column => {
      const uniqueValues = new Set(data.map(row => String(row[column] || '')));
      const count = uniqueValues.size;
      const isHighCardinality = count > 10; // Threshold for high cardinality
      cardinalityInfo[column] = { count, isHighCardinality };
    });
    
    return cardinalityInfo;
  };

  const cardinalityInfo = analyzeCardinality();
  const hasHighCardinalityColumns = Object.values(cardinalityInfo).some(info => info.isHighCardinality);

  // Determine normalization method based on title
  const isNormalizationStep = title.includes('normalisasi') || title.includes('Normalisasi');
  const normalizationMethod = isNormalizationStep ? 'Min-Max (0-1)' : '';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
          <Database size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-gray-600 text-sm mt-1">{description}</p>
          
          {/* Cardinality Warning for Categorical Data */}
          {categoricalColumns.length > 0 && hasHighCardinalityColumns && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 text-sm">Peringatan Cardinality Tinggi</h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    Beberapa kolom kategorikal memiliki banyak nilai unik yang dapat membuat clustering tidak efektif:
                  </p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(cardinalityInfo)
                      .filter(([_, info]) => info.isHighCardinality)
                      .map(([column, info]) => (
                        <div key={column} className="text-xs text-yellow-700">
                          • <strong>{column}</strong>: {info.count} nilai unik
                        </div>
                      ))
                    }
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Smart One-Hot Encoding akan memfilter kolom dengan cardinality tinggi secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Good Cardinality Info */}
          {categoricalColumns.length > 0 && !hasHighCardinalityColumns && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 text-sm">Data Cocok untuk Clustering</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Semua kolom kategorikal memiliki cardinality yang sesuai untuk clustering (≤10 nilai unik).
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isNormalizationStep && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Metode Normalisasi:</strong> {normalizationMethod} scaling
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Menggunakan Min-Max normalization untuk rentang nilai 0-1 yang lebih natural untuk clustering
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
            <span>{data.length} baris data</span>
            <span>•</span>
            <span>{headers.length} kolom</span>
            <span>•</span>
            <span>{numericalColumns.length} kolom numerik</span>
            <span>•</span>
            <span>{categoricalColumns.length} kolom kategorikal</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          {isExpanded ? 'Sembunyikan' : 'Lihat Data'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Column Types Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Tipe Kolom</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2">Kolom Numerik ({numericalColumns.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {numericalColumns.map(col => (
                    <span key={col} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {col}
                    </span>
                  ))}
                  {numericalColumns.length === 0 && (
                    <span className="text-xs text-gray-500 italic">Tidak ada kolom numerik</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">Kolom Kategorikal ({categoricalColumns.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {categoricalColumns.map(col => {
                    const info = cardinalityInfo[col];
                    const isHighCardinality = info?.isHighCardinality || false;
                    return (
                      <span 
                        key={col} 
                        className={`px-2 py-1 text-xs rounded ${
                          isHighCardinality 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}
                        title={info ? `${info.count} nilai unik` : ''}
                      >
                        {col} {info && `(${info.count})`}
                      </span>
                    );
                  })}
                  {categoricalColumns.length === 0 && (
                    <span className="text-xs text-gray-500 italic">Tidak ada kolom kategorikal</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.slice(0, 8).map((header) => (
                    <th key={header} className="px-4 py-3 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </span>
                        {getColumnBadge(header)}
                      </div>
                    </th>
                  ))}
                  {headers.length > 8 && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ... +{headers.length - 8} kolom lainnya
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {headers.slice(0, 8).map((header) => {
                      const value = row[header];
                      const isNumeric = numericalColumns.includes(header);
                      const displayValue = isNumeric && typeof value === 'number' 
                        ? value.toFixed(3) 
                        : value?.toString() || '-';
                      
                      return (
                        <td key={header} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {displayValue}
                        </td>
                      );
                    })}
                    {headers.length > 8 && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        ...
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + rowsPerPage, data.length)} dari {data.length} baris
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Sebelumnya
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        {/* Previous Button */}
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Sebelumnya
          </button>
        )}
        
        {/* Spacer if no previous button */}
        {!onPrevious && <div></div>}

        {/* Next Button */}
        {showNextButton && onNext && (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            {nextButtonText}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DataPreview;