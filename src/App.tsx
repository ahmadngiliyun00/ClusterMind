import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ClusterExperiments from './components/ClusterExperiments';
import ClusterResult from './components/ClusterResult';
import Visualization from './components/Visualization';
import { parseFile } from './utils/csv';
import type { ParsedData, DataPoint } from './utils/csv';
import { performKMeansClustering, calculateElbowMethod } from './utils/clustering';
import type { ClusteringResult } from './utils/clustering';
import { performNominalToNumerical, performNormalization } from './utils/preprocessing';

import { Brain, BarChart3, Users, ArrowRight, Share2, Menu, X, Database, Zap } from 'lucide-react';

interface ClusterExperiment {
  id: string;
  k: number;
  name: string;
}

interface ExperimentResult extends ClusteringResult {
  experimentName: string;
  k: number;
}

function App() {
  // State
  const [rawData, setRawData] = useState<ParsedData | null>(null);
  const [numericalData, setNumericalData] = useState<ParsedData | null>(null);
  const [normalizedData, setNormalizedData] = useState<ParsedData | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inertiaValues, setInertiaValues] = useState<number[] | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showAbout, setShowAbout] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Handle file upload
  const handleFileUpload = async (file: File, separator?: string) => {
    try {
      setIsLoading(true);
      const data = await parseFile(file, separator);
      setRawData(data);
      setNumericalData(null);
      setNormalizedData(null);
      setExperimentResults([]);
      setInertiaValues(null);
      setActiveStep(2);
      setShowAbout(false);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Terjadi kesalahan saat mengurai file. Pastikan format file sudah benar: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle nominal to numerical conversion
  const handleNominalToNumerical = async () => {
    if (!rawData) return;
    
    try {
      setIsLoading(true);
      const processedData = await performNominalToNumerical(rawData);
      setNumericalData(processedData);
      setActiveStep(3);
    } catch (error) {
      console.error('Error converting nominal to numerical:', error);
      alert('Terjadi kesalahan saat mengkonversi data nominal ke numerik.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle normalization
  const handleNormalization = async () => {
    const dataToNormalize = numericalData || rawData;
    if (!dataToNormalize) return;
    
    try {
      setIsLoading(true);
      const normalizedResult = await performNormalization(dataToNormalize);
      setNormalizedData(normalizedResult);
      setActiveStep(4);
    } catch (error) {
      console.error('Error normalizing data:', error);
      alert('Terjadi kesalahan saat melakukan normalisasi data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run clustering experiments
  const runClusteringExperiments = async (experiments: ClusterExperiment[]) => {
    if (!normalizedData) return;
    
    try {
      setIsLoading(true);
      const results: ExperimentResult[] = [];
      
      for (const experiment of experiments) {
        const result = await performKMeansClustering(
          normalizedData.data,
          normalizedData.numericalColumns,
          experiment.k
        );
        
        results.push({
          ...result,
          experimentName: experiment.name,
          k: experiment.k
        });
      }
      
      setExperimentResults(results);
      setActiveStep(5);
    } catch (error) {
      console.error('Error performing clustering experiments:', error);
      alert('Terjadi kesalahan saat melakukan eksperimen clustering.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Elbow Method
  const runElbowMethod = async () => {
    if (!normalizedData) return;
    
    try {
      setIsLoading(true);
      const inertia = await calculateElbowMethod(
        normalizedData.data,
        normalizedData.numericalColumns
      );
      setInertiaValues(inertia);
    } catch (error) {
      console.error('Error calculating elbow method:', error);
      alert('Terjadi kesalahan saat menghitung metode elbow.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setRawData(null);
    setNumericalData(null);
    setNormalizedData(null);
    setExperimentResults([]);
    setInertiaValues(null);
    setActiveStep(1);
    setShowAbout(true);
  };

  // Navigation functions
  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const goToNextStep = () => {
    if (activeStep === 3 && numericalData) {
      handleNormalization();
    } else if (activeStep === 4 && normalizedData) {
      setActiveStep(5);
    }
  };

  // Determine next step logic
  const getNextStepInfo = () => {
    if (!rawData) return null;
    
    if (rawData.numericalColumns.length === 0) {
      // All categorical - need conversion
      return {
        nextStep: 3,
        buttonText: "Konversi ke Numerik",
        action: handleNominalToNumerical
      };
    } else if (rawData.categoricalColumns.length > 0) {
      // Mixed data - need conversion
      return {
        nextStep: 3,
        buttonText: "Konversi ke Numerik",
        action: handleNominalToNumerical
      };
    } else {
      // All numerical - skip to normalization
      return {
        nextStep: 4,
        buttonText: "Lakukan Normalisasi",
        action: handleNormalization
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-gray-500 text-white">
        <nav className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">ClusterMind</h1>
              <p className="text-indigo-100 text-sm md:text-base">
                Empower Your Data. Discover New Segments. Unlock Insights.
              </p>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => setShowAbout(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showAbout ? 'bg-indigo/10' : 'hover:bg-white/5'
                }`}
              >
                Tentang ClusterMind
              </button>
              <button
                onClick={() => setShowAbout(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showAbout ? 'bg-purple/10' : 'hover:bg-white/5'
                }`}
              >
                Mulai Clustering
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-2">
              <button
                onClick={() => {
                  setShowAbout(true);
                  setIsMenuOpen(false);
                }}
                className={`block w-full px-4 py-2 rounded-lg transition-colors ${
                  showAbout ? 'bg-indigo/10' : 'hover:bg-white/5'
                }`}
              >
                Tentang ClusterMind
              </button>
              <button
                onClick={() => {
                  setShowAbout(false);
                  setIsMenuOpen(false);
                }}
                className={`block w-full px-4 py-2 rounded-lg transition-colors ${
                  !showAbout ? 'bg-purple/10' : 'hover:bg-white/5'
                }`}
              >
                Mulai Clustering
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8" style={{ minHeight: 'calc(100vh - 192px)' }}>
        {showAbout ? (
          <section>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-700">Tentang ClusterMind</h2>
              <p className="text-gray-700 mb-6">
                ClusterMind adalah aplikasi web interaktif yang dirancang untuk membantu Anda melakukan 
                clustering data secara mudah dan cepat menggunakan algoritma K-Means. 
                Analisis data Anda langsung di browser, tanpa perlu menginstal software tambahan.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Clustering Otomatis</h3>
                  <p className="text-gray-700 text-sm">
                    Analisis data secara cepat dengan algoritma K-Means yang berjalan di browser Anda.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Visualisasi Interaktif</h3>
                  <p className="text-gray-700 text-sm">
                    Lihat hasil clustering dalam bentuk grafik dan tabel yang intuitif.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <ArrowRight className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Metode Elbow</h3>
                  <p className="text-gray-700 text-sm">
                    Tentukan jumlah cluster optimal dengan analisis Metode Elbow.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <Share2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Multi Format</h3>
                  <p className="text-gray-700 text-sm">
                    Mendukung file CSV, XLS, dan XLSX dengan pemilihan separator otomatis.
                  </p>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Use Cases</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 p-4 rounded-md">
                  <h4 className="font-medium mb-2 text-gray-700">Segmentasi Pelanggan</h4>
                  <p className="text-sm text-gray-600">
                    Kelompokkan pelanggan berdasarkan perilaku, demografi, atau pola pembelian.
                  </p>
                </div>
                <div className="border border-gray-200 p-4 rounded-md">
                  <h4 className="font-medium mb-2 text-gray-700">Analisis Data Pendidikan</h4>
                  <p className="text-sm text-gray-600">
                    Identifikasi pola dalam data akademik untuk meningkatkan proses pembelajaran.
                  </p>
                </div>
                <div className="border border-gray-200 p-4 rounded-md">
                  <h4 className="font-medium mb-2 text-gray-700">Eksperimen Machine Learning</h4>
                  <p className="text-sm text-gray-600">
                    Uji coba algoritma clustering sebelum implementasi model AI yang lebih kompleks.
                  </p>
                </div>
                <div className="border border-gray-200 p-4 rounded-md">
                  <h4 className="font-medium mb-2 text-gray-700">Riset Akademik</h4>
                  <p className="text-sm text-gray-600">
                    Analisis data penelitian untuk menemukan pola dan hubungan yang tersembunyi.
                  </p>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Teknologi</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">React</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">TypeScript</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">Tailwind CSS</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">ml-kmeans</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">PapaParse</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">XLSX</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">Recharts</span>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAbout(false)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Mulai Clustering
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Workflow Steps */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-4xl">
                <ol className="flex items-center w-full justify-center">
                  {[1, 2, 3, 4, 5].map((step, index) => (
                    <React.Fragment key={step}>
                      <li className="flex items-center">
                        <span className={`flex items-center justify-center w-12 h-12 border-4 text-lg font-bold rounded-full ${
                          activeStep >= step 
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-white text-white shadow-lg shadow-purple-500/25' 
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          {step}
                        </span>
                      </li>
                      {index < 4 && (
                        <li className={`flex items-center w-full ${
                          activeStep > step 
                            ? 'after:content-[""] after:w-full after:h-1 after:border-b after:border-indigo-500 after:border-4 after:inline-block' 
                            : 'after:content-[""] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-4 after:inline-block'
                        }`}>
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ol>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Upload</span>
                  <span>Preview</span>
                  <span>Numerical</span>
                  <span>Normalize</span>
                  <span>Clustering</span>
                </div>
              </div>
            </div>

            {/* Workflow Content */}
            <div className="space-y-8">
              {/* Step 1: File Upload */}
              {activeStep === 1 && (
                <section>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                      Langkah 1: Upload Data
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Upload file CSV, XLS, atau XLSX Anda untuk mulai menganalisis dan mengelompokkan data. 
                      Pastikan file memiliki header dan berisi data numerik untuk kolom yang akan digunakan dalam clustering.
                    </p>
                    <FileUpload onFileUpload={handleFileUpload} />
                    {isLoading && (
                      <div className="mt-4 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-2 text-sm text-gray-600">Memproses file...</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Step 2: Raw Data Preview */}
              {activeStep >= 2 && rawData && (
                <section>
                  <DataPreview
                    data={rawData.data}
                    headers={rawData.headers}
                    title="Data berhasil diupload"
                    description="Berikut adalah preview data yang telah diupload. Periksa struktur data sebelum melanjutkan ke tahap berikutnya."
                    numericalColumns={rawData.numericalColumns}
                    categoricalColumns={rawData.categoricalColumns}
                    onNext={getNextStepInfo()?.action}
                    nextButtonText={getNextStepInfo()?.buttonText || "Lanjutkan"}
                    showNextButton={activeStep === 2}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 3: Numerical Data (only show if conversion happened) */}
              {activeStep >= 3 && numericalData && (
                <section>
                  <DataPreview
                    data={numericalData.data}
                    headers={numericalData.headers}
                    title="Data telah dikonversi ke numerik"
                    description="Semua kolom kategorikal telah dikonversi menjadi numerik menggunakan label encoding. Data siap untuk dinormalisasi."
                    numericalColumns={numericalData.numericalColumns}
                    categoricalColumns={numericalData.categoricalColumns}
                    onNext={activeStep === 3 ? goToNextStep : undefined}
                    nextButtonText="Lakukan Normalisasi"
                    showNextButton={activeStep === 3}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 4: Normalized Data */}
              {activeStep >= 4 && normalizedData && (
                <section>
                  <DataPreview
                    data={normalizedData.data}
                    headers={normalizedData.headers}
                    title="Data telah dinormalisasi"
                    description="Data telah dinormalisasi menggunakan min-max scaling. Semua nilai berada dalam rentang 0-1. Data siap untuk clustering."
                    numericalColumns={normalizedData.numericalColumns}
                    categoricalColumns={normalizedData.categoricalColumns}
                    onNext={activeStep === 4 ? goToNextStep : undefined}
                    nextButtonText="Lanjut ke Clustering"
                    showNextButton={activeStep === 4}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 5: Clustering Configuration */}
              {activeStep >= 5 && normalizedData && (
                <section>
                  <ClusterExperiments
                    onRunExperiments={runClusteringExperiments}
                    onRunElbowMethod={runElbowMethod}
                    isLoading={isLoading}
                    maxK={Math.min(10, Math.floor(normalizedData.data.length / 3))}
                  />
                </section>
              )}

              {/* Results */}
              {experimentResults.length > 0 && (
                <section className="space-y-8">
                  {experimentResults.map((result, index) => (
                    <div key={result.experimentName} className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {result.experimentName} (K = {result.k})
                      </h3>
                      <ClusterResult
                        data={result.data}
                        headers={normalizedData?.headers || []}
                        onReset={index === 0 ? handleReset : undefined}
                      />
                      <Visualization
                        data={result.data}
                        inertiaValues={index === 0 ? inertiaValues || undefined : undefined}
                        numericalColumns={normalizedData?.numericalColumns || []}
                      />
                    </div>
                  ))}
                </section>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            ClusterMind &copy; {new Date().getFullYear()} - Aplikasi Clustering Data Interaktif
          </p>
          <p className="text-gray-400 text-sm">
            "Empower Your Data. Discover New Segments. Unlock Insights."
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;