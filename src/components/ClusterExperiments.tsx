import React, { useState } from 'react';
import { Plus, Trash2, Play, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ClusterExperiment {
  id: string;
  k: number;
  name: string;
}

interface ClusterExperimentsProps {
  onRunExperiments: (experiments: ClusterExperiment[]) => void;
  onRunElbowMethod: () => void;
  isLoading: boolean;
  loadingProgress?: string;
  currentExperiment?: number;
  totalExperiments?: number;
  maxK: number;
  showElbowButton?: boolean;
}

const ClusterExperiments: React.FC<ClusterExperimentsProps> = ({
  onRunExperiments,
  onRunElbowMethod,
  isLoading,
  loadingProgress = '',
  currentExperiment = 0,
  totalExperiments = 0,
  maxK = 10,
  showElbowButton = false
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('k-means');
  const [experiments, setExperiments] = useState<ClusterExperiment[]>([
    { id: '1', k: 2, name: 'Eksperimen 1' },
    { id: '2', k: 3, name: 'Eksperimen 2' },
    { id: '3', k: 4, name: 'Eksperimen 3' },
    { id: '4', k: 5, name: 'Eksperimen 4' },
    { id: '5', k: 6, name: 'Eksperimen 5' }
  ]);

  const addExperiment = () => {
    const newId = (experiments.length + 1).toString();
    const newK = Math.min(experiments.length + 2, maxK);
    setExperiments([
      ...experiments,
      {
        id: newId,
        k: newK,
        name: `Eksperimen ${experiments.length + 1}`
      }
    ]);
  };

  const removeExperiment = (id: string) => {
    if (experiments.length > 5) {
      setExperiments(experiments.filter(exp => exp.id !== id));
    }
  };

  const updateExperiment = (id: string, field: keyof ClusterExperiment, value: string | number) => {
    setExperiments(experiments.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleRunExperiments = () => {
    console.log('\n🚀 USER INITIATED CLUSTERING EXPERIMENTS');
    console.log('='.repeat(50));
    console.log(`Total experiments: ${experiments.length}`);
    console.log('Experiments to run:', experiments.map(exp => `${exp.name} (K=${exp.k})`).join(', '));
    console.log('='.repeat(50));
    
    onRunExperiments(experiments);
  };

  const handleRunElbowMethod = () => {
    console.log('\n📈 USER INITIATED ELBOW METHOD ANALYSIS');
    console.log('='.repeat(50));
    console.log('Starting comprehensive elbow analysis...');
    console.log('='.repeat(50));
    
    onRunElbowMethod();
  };

  // Check if it's elbow analysis loading
  const isElbowLoading = isLoading && loadingProgress.includes('Elbow');
  const isExperimentLoading = isLoading && !isElbowLoading;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Konfigurasi Algoritma</h2>
      </div>
      
      <div className="space-y-6">
        {/* Algorithm Selection */}
        <div>
          <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
            Algoritma
          </label>
          <select
            id="algorithm"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="k-means">K-Means</option>
            <option value="k-medoids" disabled>K-Medoids (Segera Hadir)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">K-Medoids akan tersedia pada versi mendatang</p>
        </div>

        {/* Cluster Experiments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Eksperimen Jumlah Cluster (Minimal 5)
            </label>
            <button
              onClick={addExperiment}
              disabled={experiments.length >= maxK || isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>

          <div className="space-y-3">
            {experiments.map((experiment, index) => (
              <div key={experiment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <input
                    type="text"
                    value={experiment.name}
                    onChange={(e) => updateExperiment(experiment.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">K =</span>
                  <input
                    type="number"
                    min={2}
                    max={maxK}
                    value={experiment.k}
                    onChange={(e) => updateExperiment(experiment.id, 'k', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
                {experiments.length > 5 && (
                  <button
                    onClick={() => removeExperiment(experiment.id)}
                    disabled={isLoading}
                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {experiments.length < 5 && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ Minimal 5 eksperimen diperlukan untuk analisis yang optimal
            </p>
          )}
        </div>

        {/* Action Buttons - Fixed Layout to Match Design */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleRunExperiments}
            disabled={isLoading || experiments.length < 5}
          >
            <Play size={20} />
            <span>Jalankan Eksperimen</span>
          </button>
          
          {showElbowButton && (
            <button
              className="flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={handleRunElbowMethod}
              disabled={isLoading}
            >
              <BarChart3 size={20} />
              <span>Analisis Elbow</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Loading State for Clustering Experiments */}
      {isExperimentLoading && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Memproses Eksperimen Clustering</h3>
              {loadingProgress && (
                <p className="text-sm text-gray-600">{loadingProgress}</p>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {totalExperiments > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress Eksperimen</span>
                <span>{currentExperiment}/{totalExperiments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentExperiment / totalExperiments) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Sedang menjalankan algoritma K-Means untuk setiap nilai K...</span>
            </div>
            
            <div className="bg-white p-4 rounded border border-blue-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Tahapan Proses:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Ekstraksi fitur numerik dari data yang telah dinormalisasi</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Menjalankan K-Means clustering dengan multiple attempts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Menghitung metrik evaluasi (WCSS & DBI)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Validasi hasil clustering dan assignment data points</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    💡 Tip: Buka Developer Console (F12) untuk melihat detail perhitungan
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Console akan menampilkan log detail untuk setiap eksperimen termasuk nilai WCSS dan DBI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Loading State for Elbow Analysis */}
      {isElbowLoading && (
        <div className="mt-6 p-6 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Memproses Analisis Elbow Method</h3>
              {loadingProgress && (
                <p className="text-sm text-gray-600">{loadingProgress}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 size={16} />
              <span>Menjalankan clustering untuk berbagai nilai K (1 hingga {maxK})...</span>
            </div>
            
            <div className="bg-white p-4 rounded border border-teal-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Tahapan Analisis Elbow:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  <span>Menghitung WCSS untuk setiap nilai K (K=1 hingga K={maxK})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  <span>Menghitung Davies-Bouldin Index untuk setiap nilai K</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  <span>Menganalisis pola penurunan WCSS untuk menentukan elbow point</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  <span>Mencari nilai K optimal berdasarkan metrik evaluasi</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    📊 Analisis Komprehensif
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Elbow Method akan menghasilkan grafik WCSS dan DBI untuk membantu menentukan jumlah cluster optimal
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    💡 Tip: Buka Developer Console (F12) untuk melihat detail perhitungan
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Console akan menampilkan log detail untuk setiap nilai K termasuk perhitungan WCSS dan DBI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterExperiments;