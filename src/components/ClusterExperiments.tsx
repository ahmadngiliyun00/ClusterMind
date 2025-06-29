import React, { useState } from 'react';
import { Plus, Trash2, Play, BarChart3 } from 'lucide-react';

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
}

const ClusterExperiments: React.FC<ClusterExperimentsProps> = ({
  onRunExperiments,
  onRunElbowMethod,
  isLoading,
  maxK = 10
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
    if (experiments.length > 1) {
      setExperiments(experiments.filter(exp => exp.id !== id));
    }
  };

  const updateExperiment = (id: string, field: keyof ClusterExperiment, value: string | number) => {
    setExperiments(experiments.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleRunExperiments = () => {
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
          
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={onRunElbowMethod}
            disabled={isLoading}
          >
            <BarChart3 size={20} />
            <span>Analisis Elbow</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-gray-600">Memproses eksperimen clustering...</p>
        </div>
      )}
    </div>
  );
};

export default ClusterExperiments;