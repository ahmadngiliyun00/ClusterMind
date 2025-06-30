import React, { useState } from 'react';
import { Plus, Trash2, Play, BarChart3, Clock, CheckCircle } from 'lucide-react';

interface ClusterExperiment {
  id: string;
  k: number;
  name: string;
}

interface ClusterExperimentsProps {
  onRunExperiments: (experiments: ClusterExperiment[]) => void;
  onRunElbowMethod: () => void;
  isLoading: boolean;
  maxK: number;
  showElbowButton?: boolean;
}

const ClusterExperiments: React.FC<ClusterExperimentsProps> = ({
  onRunExperiments,
  onRunElbowMethod,
  isLoading,
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
    console.log('\n🚀 STARTING CLUSTERING EXPERIMENTS');
    console.log('='.repeat(50));
    console.log(`Total experiments: ${experiments.length}`);
    console.log('Experiments to run:', experiments.map(exp => `${exp.name} (K=${exp.k})`).join(', '));
    console.log('='.repeat(50));
    
    onRunExperiments(experiments);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Konfigurasi Algoritma</h2>
      
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

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleRunExperiments}
            disabled={isLoading || experiments.length < 5}
          >
            <Play size={20} />
            <span>Jalankan Eksperimen</span>
          </button>
          
          {showElbowButton && (
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={onRunElbowMethod}
              disabled={isLoading}
            >
              <BarChart3 size={20} />
              <span>Analisis Elbow</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State with Progress */}
      {isLoading && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <h3 className="text-lg font-medium text-gray-800">Memproses Eksperimen Clustering</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Sedang menjalankan algoritma K-Means untuk setiap nilai K...</span>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium text-gray-700 mb-2">Progress:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Ekstraksi fitur numerik dari data</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Menjalankan K-Means untuk setiap eksperimen</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Menghitung metrik evaluasi (WCSS & DBI)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Buka Developer Console (F12) untuk melihat detail perhitungan setiap eksperimen
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterExperiments;