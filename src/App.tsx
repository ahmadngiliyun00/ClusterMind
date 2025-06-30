import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ClusterExperiments from './components/ClusterExperiments';
import ClusterResult from './components/ClusterResult';
import Visualization from './components/Visualization';
import ElbowAnalysis from './components/ElbowAnalysis';
import { parseFile } from './utils/csv';
import type { ParsedData, DataPoint } from './utils/csv';
import { performKMeansClustering, calculateElbowMethodFromExperiments } from './utils/clustering';
import type { ClusteringResult } from './utils/clustering';
import { performOneHotEncoding, performNormalization } from './utils/preprocessing';

import { Brain, BarChart3, Users, ArrowRight, Share2, Menu, X, Database, Zap } from 'lucide-react';

interface ClusterExperiment {
  id: string;
  k: number;
  name: string;
}

interface ExperimentResult extends ClusteringResult {
  experimentName: string;
  k: number;
  daviesBouldinIndex: number;
  wcss: number;
}

function App() {
  // State
  const [rawData, setRawData] = useState<ParsedData | null>(null);
  const [processedData, setProcessedData] = useState<ParsedData | null>(null);
  const [normalizedData, setNormalizedData] = useState<ParsedData | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);
  const [currentExperiments, setCurrentExperiments] = useState<ClusterExperiment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [currentExperiment, setCurrentExperiment] = useState<number>(0);
  const [totalExperiments, setTotalExperiments] = useState<number>(0);
  const [elbowData, setElbowData] = useState<{ wcss: number[]; dbi: number[]; kValues: number[] } | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showAbout, setShowAbout] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showNormalizationStep, setShowNormalizationStep] = useState(false);
  
  // Handle file upload
  const handleFileUpload = async (file: File, separator?: string) => {
    try {
      setIsLoading(true);
      const data = await parseFile(file, separator);
      setRawData(data);
      setProcessedData(null);
      setNormalizedData(null);
      setExperimentResults([]);
      setCurrentExperiments([]);
      setElbowData(null);
      setActiveStep(2);
      setShowAbout(false);
      setShowNormalizationStep(false);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Terjadi kesalahan saat mengurai file. Pastikan format file sudah benar: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle One-Hot Encoding with smart filtering
  const handleOneHotEncoding = async () => {
    if (!rawData) return;
    
    try {
      setIsLoading(true);
      setLoadingProgress('Menganalisis data dan melakukan One-Hot Encoding...');
      
      console.log('\n🔄 STARTING ONE-HOT ENCODING PROCESS');
      console.log('='.repeat(60));
      
      const result = await performOneHotEncoding(rawData);
      
      console.log('\n✅ ONE-HOT ENCODING COMPLETED');
      console.log('='.repeat(60));
      
      // Show validation results to user
      if (result.validationResult && !result.validationResult.isValid) {
        const warnings = result.validationResult.warnings.join('\n');
        const recommendations = result.validationResult.recommendations.join('\n');
        
        alert(`⚠️ Peringatan Data Clustering:\n\n${warnings}\n\nRekomendasi:\n${recommendations}`);
      }
      
      if (result.excludedColumns && result.excludedColumns.length > 0) {
        alert(`📊 Kolom yang dikecualikan dari clustering:\n${result.excludedColumns.join(', ')}\n\nKolom ini memiliki terlalu banyak nilai unik dan dapat membuat clustering tidak efektif.`);
      }
      
      setProcessedData(result);
      setActiveStep(3);
      
      // Check if normalization is needed
      const needsNormalization = await checkIfNormalizationNeeded(result);
      if (needsNormalization) {
        setShowNormalizationStep(true);
      } else {
        // Auto-proceed to normalization if not needed for display
        await performNormalizationStep(result);
      }
      
    } catch (error) {
      console.error('Error in One-Hot Encoding:', error);
      alert('Terjadi kesalahan saat melakukan One-Hot Encoding: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // Check if normalization is needed (for display purposes)
  const checkIfNormalizationNeeded = async (data: ParsedData): Promise<boolean> => {
    // Check if data contains non-binary values that would benefit from normalization
    const sampleValues = data.data.slice(0, 10);
    const hasNonBinaryValues = sampleValues.some(row => 
      data.numericalColumns.some(col => {
        const val = Number(row[col]);
        return !isNaN(val) && val !== 0 && val !== 1;
      })
    );
    
    return hasNonBinaryValues;
  };

  // Handle normalization as a separate function
  const performNormalizationStep = async (dataToNormalize: ParsedData) => {
    try {
      setLoadingProgress('Melakukan normalisasi data...');
      
      const normalizedResult = await performNormalization(dataToNormalize);
      setNormalizedData(normalizedResult);
      
      if (showNormalizationStep) {
        setActiveStep(4); // Show normalization step
      } else {
        setActiveStep(4); // Skip to clustering configuration
      }
    } catch (error) {
      console.error('Error normalizing data:', error);
      alert('Terjadi kesalahan saat melakukan normalisasi data: ' + (error as Error).message);
    }
  };

  // Handle manual normalization trigger
  const handleNormalization = async () => {
    if (!processedData) return;
    
    try {
      setIsLoading(true);
      await performNormalizationStep(processedData);
    } catch (error) {
      console.error('Error in normalization:', error);
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // Add delay function for better UX
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Run clustering experiments with proper progress and logging
  const runClusteringExperiments = async (experiments: ClusterExperiment[]) => {
    if (!normalizedData) return;
    
    try {
      setIsLoading(true);
      setExperimentResults([]); // Clear previous results immediately
      setElbowData(null); // Clear elbow data when running new experiments
      setCurrentExperiments(experiments); // Store current experiments for elbow analysis
      setCurrentExperiment(0);
      setTotalExperiments(experiments.length);
      setLoadingProgress('Memulai eksperimen clustering...');
      
      // Clear console and start logging
      console.clear();
      console.log('\n🔬 CLUSTERING EXPERIMENTS STARTED');
      console.log('='.repeat(80));
      console.log(`📊 Dataset: ${normalizedData.data.length} rows × ${normalizedData.numericalColumns.length} features`);
      console.log(`🔢 Features: [${normalizedData.numericalColumns.join(', ')}]`);
      console.log(`🧪 Total experiments: ${experiments.length}`);
      console.log(`📋 Experiments: ${experiments.map(exp => `${exp.name}(K=${exp.k})`).join(', ')}`);
      console.log('='.repeat(80));
      
      const results: ExperimentResult[] = [];
      
      for (let i = 0; i < experiments.length; i++) {
        const experiment = experiments[i];
        setCurrentExperiment(i + 1);
        setLoadingProgress(`Eksperimen ${i + 1}/${experiments.length}: ${experiment.name} (K=${experiment.k})`);
        
        console.log(`\n🔬 EXPERIMENT ${i + 1}/${experiments.length}: ${experiment.name}`);
        console.log('─'.repeat(60));
        console.log(`📈 K = ${experiment.k}`);
        console.log(`⏱️  Starting clustering process...`);
        
        try {
          // Add delay to show progress
          await delay(800);
          
          const startTime = performance.now();
          
          console.log(`🔄 Running K-Means clustering...`);
          const result = await performKMeansClustering(
            normalizedData.data,
            normalizedData.numericalColumns,
            experiment.k
          );
          
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          
          const experimentResult: ExperimentResult = {
            ...result,
            experimentName: experiment.name,
            k: experiment.k,
            daviesBouldinIndex: result.daviesBouldinIndex || 0,
            wcss: result.wcss || 0
          };
          
          results.push(experimentResult);
          
          // Log detailed results
          console.log(`✅ EXPERIMENT ${i + 1} COMPLETED`);
          console.log(`⏱️  Duration: ${duration}ms`);
          console.log(`📊 Results:`);
          console.log(`   • K = ${experiment.k}`);
          console.log(`   • WCSS = ${result.wcss?.toFixed(4) || 'N/A'}`);
          console.log(`   • Davies-Bouldin Index = ${result.daviesBouldinIndex?.toFixed(4) || 'N/A'}`);
          console.log(`   • Cluster sizes: [${result.clusterSizes.join(', ')}]`);
          console.log(`   • Total data points: ${result.data.length}`);
          
          // Validate results
          if (result.wcss === undefined || result.daviesBouldinIndex === undefined) {
            console.warn(`⚠️  Warning: Some metrics are undefined for experiment ${i + 1}`);
          }
          
          console.log('─'.repeat(60));
          
          // Add delay between experiments
          if (i < experiments.length - 1) {
            await delay(500);
          }
          
        } catch (error) {
          console.error(`❌ EXPERIMENT ${i + 1} FAILED:`, error);
          console.log(`🚫 Skipping ${experiment.name} due to error: ${(error as Error).message}`);
          console.log('─'.repeat(60));
          // Continue with other experiments
        }
      }
      
      // Final summary
      console.log('\n🎉 ALL EXPERIMENTS COMPLETED');
      console.log('='.repeat(80));
      console.log('📋 SUMMARY REPORT:');
      console.log('─'.repeat(40));
      
      if (results.length > 0) {
        console.log('| Exp | K | WCSS      | DBI      | Status |');
        console.log('|-----|---|-----------|----------|--------|');
        results.forEach((result, i) => {
          const wcss = result.wcss?.toFixed(3) || 'N/A';
          const dbi = result.daviesBouldinIndex?.toFixed(3) || 'N/A';
          console.log(`| ${(i + 1).toString().padStart(3)} | ${result.k} | ${wcss.padStart(9)} | ${dbi.padStart(8)} | ✅ OK  |`);
        });
        
        // Find best results
        const validResults = results.filter(r => r.wcss !== undefined && r.daviesBouldinIndex !== undefined);
        if (validResults.length > 0) {
          const bestWCSS = validResults.reduce((min, r) => r.wcss < min.wcss ? r : min);
          const bestDBI = validResults.reduce((min, r) => r.daviesBouldinIndex < min.daviesBouldinIndex ? r : min);
          
          console.log('\n🏆 BEST RESULTS:');
          console.log(`   • Lowest WCSS: ${bestWCSS.experimentName} (K=${bestWCSS.k}, WCSS=${bestWCSS.wcss.toFixed(4)})`);
          console.log(`   • Lowest DBI: ${bestDBI.experimentName} (K=${bestDBI.k}, DBI=${bestDBI.daviesBouldinIndex.toFixed(4)})`);
        }
      } else {
        console.log('❌ No experiments completed successfully');
      }
      
      console.log('='.repeat(80));
      console.log('💡 Tip: Lower WCSS and DBI values indicate better clustering quality');
      console.log('📈 Use "Analisis Elbow" to find optimal K value');
      
      if (results.length === 0) {
        throw new Error('Tidak ada eksperimen yang berhasil dijalankan');
      }
      
      setExperimentResults(results);
      setActiveStep(5); // Move to step 5 for clustering results
      setActiveTab(0); // Reset to first tab
      
    } catch (error) {
      console.error('❌ CLUSTERING EXPERIMENTS FAILED:', error);
      alert('Terjadi kesalahan saat melakukan eksperimen clustering: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
      setCurrentExperiment(0);
      setTotalExperiments(0);
    }
  };

  // Run Elbow Method with enhanced progress and logging - FIXED TO USE EXPERIMENT K VALUES
  const runElbowMethod = async () => {
    if (!normalizedData || currentExperiments.length === 0) {
      alert('Tidak ada eksperimen yang tersedia untuk analisis elbow');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingProgress('Memulai analisis Elbow Method...');
      
      // Get K values from current experiments
      const kValues = currentExperiments.map(exp => exp.k).sort((a, b) => a - b);
      
      // Clear console and start logging
      console.clear();
      console.log('\n📈 ELBOW METHOD ANALYSIS STARTED');
      console.log('='.repeat(80));
      console.log(`📊 Dataset: ${normalizedData.data.length} rows × ${normalizedData.numericalColumns.length} features`);
      console.log(`🔢 Features: [${normalizedData.numericalColumns.join(', ')}]`);
      console.log(`📋 Testing K values from experiments: [${kValues.join(', ')}]`);
      console.log(`🧪 Total K values to test: ${kValues.length}`);
      console.log('='.repeat(80));
      
      // Add delay to show loading state
      await delay(1000);
      
      setLoadingProgress('Menghitung WCSS dan DBI untuk nilai K dari eksperimen...');
      await delay(500);
      
      setLoadingProgress('Menganalisis pola elbow untuk menentukan K optimal...');
      
      const elbowResult = await calculateElbowMethodFromExperiments(
        normalizedData.data,
        normalizedData.numericalColumns,
        kValues
      );
      
      console.log('\n✅ ELBOW ANALYSIS COMPLETED');
      console.log('='.repeat(80));
      console.log('📋 ELBOW METHOD SUMMARY:');
      console.log('─'.repeat(40));
      console.log('| K | WCSS      | DBI      |');
      console.log('|---|-----------|----------|');
      elbowResult.wcss.forEach((wcss, i) => {
        const k = kValues[i];
        const dbi = elbowResult.dbi[i]?.toFixed(3) || 'N/A';
        console.log(`| ${k.toString().padStart(1)} | ${wcss.toFixed(3).padStart(9)} | ${dbi.padStart(8)} |`);
      });
      
      // Find elbow point
      const elbowK = findElbowPoint(elbowResult.wcss, kValues);
      const optimalDBI = findOptimalDBI(elbowResult.dbi, kValues);
      
      console.log('\n🎯 RECOMMENDATIONS:');
      if (elbowK) {
        console.log(`   • Elbow Point (WCSS): K = ${elbowK}`);
      }
      if (optimalDBI) {
        console.log(`   • Optimal DBI: K = ${optimalDBI}`);
      }
      console.log('='.repeat(80));
      console.log('💡 Tip: Look for the "elbow" in WCSS graph and minimum DBI value');
      
      setElbowData({
        wcss: elbowResult.wcss,
        dbi: elbowResult.dbi,
        kValues: kValues
      });
      setActiveStep(6); // Move to step 6 for elbow analysis
      
    } catch (error) {
      console.error('❌ ELBOW ANALYSIS FAILED:', error);
      alert('Terjadi kesalahan saat melakukan analisis elbow: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // Helper functions for elbow analysis - UPDATED TO USE K VALUES
  const findElbowPoint = (wcssValues: number[], kValues: number[]): number | null => {
    if (wcssValues.length < 3) return null;
    
    let maxDiff = 0;
    let elbowK = kValues[1]; // Start from second K value
    
    for (let i = 1; i < wcssValues.length - 1; i++) {
      const diff1 = wcssValues[i - 1] - wcssValues[i];
      const diff2 = wcssValues[i] - wcssValues[i + 1];
      const totalDiff = diff1 - diff2;
      
      if (totalDiff > maxDiff) {
        maxDiff = totalDiff;
        elbowK = kValues[i];
      }
    }
    
    return elbowK;
  };

  const findOptimalDBI = (dbiValues: number[], kValues: number[]): number | null => {
    if (dbiValues.length < 1) return null;
    
    let minDBI = Infinity;
    let optimalK = kValues[0];
    
    for (let i = 0; i < dbiValues.length; i++) {
      if (dbiValues[i] > 0 && dbiValues[i] < minDBI) {
        minDBI = dbiValues[i];
        optimalK = kValues[i];
      }
    }
    
    return optimalK;
  };

  // Navigation functions
  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const goToNextStep = () => {
    if (activeStep === 2 && rawData) {
      handleOneHotEncoding();
    } else if (activeStep === 3 && processedData && showNormalizationStep) {
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
        buttonText: "Proses Data & Mulai Clustering",
        action: handleOneHotEncoding
      };
    } else if (rawData.categoricalColumns.length > 0) {
      // Mixed data - need conversion
      return {
        nextStep: 3,
        buttonText: "Proses Data & Mulai Clustering",
        action: handleOneHotEncoding
      };
    } else {
      // All numerical - skip to clustering
      return {
        nextStep: 3,
        buttonText: "Mulai Clustering",
        action: async () => {
          await performNormalizationStep(rawData);
        }
      };
    }
  };

  // Reset everything
  const handleReset = () => {
    setRawData(null);
    setProcessedData(null);
    setNormalizedData(null);
    setExperimentResults([]);
    setCurrentExperiments([]);
    setElbowData(null);
    setActiveStep(1);
    setShowAbout(true);
    setActiveTab(0);
    setIsLoading(false);
    setLoadingProgress('');
    setCurrentExperiment(0);
    setTotalExperiments(0);
    setShowNormalizationStep(false);
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
                clustering data secara mudah dan cepat menggunakan algoritma K-Means dengan Smart One-Hot Encoding 
                dan Min-Max normalization. Analisis data Anda langsung di browser, tanpa perlu menginstal software tambahan.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Smart One-Hot Encoding</h3>
                  <p className="text-gray-700 text-sm">
                    Otomatis memfilter kolom dengan cardinality tinggi untuk clustering yang lebih efektif.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Metrik Lengkap</h3>
                  <p className="text-gray-700 text-sm">
                    Davies-Bouldin Index dan WCSS untuk evaluasi kualitas cluster yang komprehensif.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <ArrowRight className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Metode Elbow</h3>
                  <p className="text-gray-700 text-sm">
                    Tentukan jumlah cluster optimal dengan analisis WCSS dan DBI.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-4">
                    <Share2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Multi Format</h3>
                  <p className="text-gray-700 text-sm">
                    Mendukung file CSV, XLS, dan XLSX dengan validasi data otomatis.
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
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">Smart One-Hot Encoding</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">Min-Max Normalization</span>
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
            {/* Workflow Steps - Dynamic based on normalization need */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-5xl">
                <ol className="flex items-center w-full justify-center">
                  {(showNormalizationStep ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]).map((step, index, array) => (
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
                      {index < array.length - 1 && (
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
                  {showNormalizationStep && <span>One-Hot</span>}
                  {showNormalizationStep && <span>Normalisasi</span>}
                  <span>Clustering</span>
                  <span>Hasil</span>
                  <span>Elbow</span>
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
                      Sistem akan otomatis menganalisis struktur data dan memberikan rekomendasi untuk clustering yang optimal.
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
                    description="Berikut adalah preview data yang telah diupload. Sistem akan menganalisis cardinality kolom kategorikal untuk clustering yang optimal."
                    numericalColumns={rawData.numericalColumns}
                    categoricalColumns={rawData.categoricalColumns}
                    onNext={getNextStepInfo()?.action}
                    nextButtonText={getNextStepInfo()?.buttonText || "Lanjutkan"}
                    showNextButton={activeStep === 2}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 3: Processed Data (One-Hot Encoded) - Only show if normalization step is needed */}
              {activeStep >= 3 && processedData && showNormalizationStep && (
                <section>
                  <DataPreview
                    data={processedData.data}
                    headers={processedData.headers}
                    title="Data telah diproses dengan Smart One-Hot Encoding"
                    description="Kolom kategorikal telah dikonversi menjadi binary features. Kolom dengan cardinality tinggi telah difilter untuk clustering yang lebih efektif."
                    numericalColumns={processedData.numericalColumns}
                    categoricalColumns={processedData.categoricalColumns}
                    onNext={activeStep === 3 ? goToNextStep : undefined}
                    nextButtonText="Lakukan Normalisasi Min-Max"
                    showNextButton={activeStep === 3}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 4: Normalized Data - Only show if normalization step is needed */}
              {activeStep >= 4 && normalizedData && showNormalizationStep && (
                <section>
                  <DataPreview
                    data={normalizedData.data}
                    headers={normalizedData.headers}
                    title="Data siap untuk clustering"
                    description="Data telah dinormalisasi dan siap untuk proses clustering K-Means. Semua fitur berada dalam skala yang sesuai untuk analisis jarak Euclidean."
                    numericalColumns={normalizedData.numericalColumns}
                    categoricalColumns={normalizedData.categoricalColumns}
                    onNext={activeStep === 4 ? goToNextStep : undefined}
                    nextButtonText="Lanjut ke Clustering"
                    showNextButton={activeStep === 4}
                    onPrevious={activeStep > 1 ? goToPreviousStep : undefined}
                  />
                </section>
              )}

              {/* Step 3/4/5: Clustering Configuration - Dynamic step number based on normalization */}
              {activeStep >= (showNormalizationStep ? 5 : 3) && normalizedData && (
                <section>
                  <ClusterExperiments
                    onRunExperiments={runClusteringExperiments}
                    onRunElbowMethod={runElbowMethod}
                    isLoading={isLoading}
                    loadingProgress={loadingProgress}
                    currentExperiment={currentExperiment}
                    totalExperiments={totalExperiments}
                    maxK={Math.min(10, Math.floor(normalizedData.data.length / 3))}
                    showElbowButton={false} // Remove elbow button from here
                  />
                </section>
              )}

              {/* Step 4/5/6: Clustering Results - Dynamic step number based on normalization */}
              {activeStep >= (showNormalizationStep ? 5 : 4) && experimentResults.length > 0 && !isLoading && (
                <section className="space-y-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">Hasil Eksperimen Clustering</h2>
                    </div>
                    
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {experimentResults.map((result, index) => (
                          <button
                            key={result.experimentName}
                            onClick={() => setActiveTab(index)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === index
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {result.experimentName} (K = {result.k})
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Tab Content */}
                    {experimentResults[activeTab] && (
                      <div className="space-y-6">
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-700 mb-1">
                              Davies-Bouldin Index
                            </h3>
                            <p className="text-2xl font-bold text-blue-900">
                              {experimentResults[activeTab].daviesBouldinIndex.toFixed(3)}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Semakin kecil semakin baik
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-green-700 mb-1">
                              WCSS (Within-Cluster Sum of Squares)
                            </h3>
                            <p className="text-2xl font-bold text-green-900">
                              {experimentResults[activeTab].wcss.toFixed(3)}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Semakin kecil semakin baik
                            </p>
                          </div>
                        </div>

                        {/* Cluster Result */}
                        <ClusterResult
                          data={experimentResults[activeTab].data}
                          headers={normalizedData?.headers || []}
                          k={experimentResults[activeTab].k}
                          onReset={activeTab === 0 ? handleReset : undefined}
                        />

                        {/* Visualization */}
                        <Visualization
                          data={experimentResults[activeTab].data}
                          numericalColumns={normalizedData?.numericalColumns || []}
                        />
                      </div>
                    )}

                    {/* Elbow Analysis Button - Moved here from ClusterExperiments */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-end">
                        <button
                          className="flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          onClick={runElbowMethod}
                          disabled={isLoading}
                        >
                          <BarChart3 size={20} />
                          <span>Analisis Elbow</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 5/6: Elbow Analysis - Dynamic step number based on normalization */}
              {activeStep >= (showNormalizationStep ? 6 : 5) && elbowData && !isLoading && (
                <section>
                  <ElbowAnalysis
                    wcssValues={elbowData.wcss}
                    dbiValues={elbowData.dbi}
                    kValues={elbowData.kValues}
                    onBack={() => setActiveStep(showNormalizationStep ? 5 : 4)}
                    onReset={handleReset}
                  />
                </section>
              )}

              {/* Loading State for One-Hot Encoding */}
              {isLoading && loadingProgress.includes('One-Hot') && (
                <section>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Memproses Smart One-Hot Encoding</h3>
                        {loadingProgress && (
                          <p className="text-sm text-gray-600">{loadingProgress}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Database size={16} />
                        <span>Menganalisis cardinality kolom kategorikal...</span>
                      </div>
                      
                      <div className="bg-white p-4 rounded border border-indigo-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Tahapan Smart One-Hot Encoding:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span>Analisis cardinality setiap kolom kategorikal</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span>Filter kolom dengan cardinality tinggi ({'>'}50 nilai unik)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span>Konversi kolom yang sesuai menjadi binary features</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span>Validasi kualitas data untuk clustering</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-600 mt-0.5">💡</div>
                          <div>
                            <p className="text-sm text-yellow-800 font-medium">
                              Smart Filtering untuk Clustering Optimal
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Sistem akan otomatis mengecualikan kolom dengan cardinality sangat tinggi ({'>'}50 nilai unik)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Loading State for Normalization */}
              {isLoading && loadingProgress.includes('normalisasi') && (
                <section>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Memproses Normalisasi Data</h3>
                        {loadingProgress && (
                          <p className="text-sm text-gray-600">{loadingProgress}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap size={16} />
                        <span>Menerapkan Min-Max normalization...</span>
                      </div>
                      
                      <div className="bg-white p-4 rounded border border-green-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Tahapan Normalisasi:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Menghitung nilai minimum dan maksimum setiap kolom</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Menerapkan formula Min-Max: (x - min) / (max - min)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Mengubah skala data ke rentang 0-1</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Validasi hasil normalisasi</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-start gap-2">
                          <div className="text-blue-600 mt-0.5">📊</div>
                          <div>
                            <p className="text-sm text-blue-800 font-medium">
                              Min-Max Normalization
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Mengubah semua fitur numerik ke skala 0-1 untuk clustering yang lebih akurat
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Loading State for Elbow Analysis */}
              {activeStep >= (showNormalizationStep ? 6 : 5) && isLoading && loadingProgress.includes('Elbow') && (
                <section>
                  <div className="bg-white rounded-lg shadow-md p-6">
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
                        <span>Menjalankan clustering untuk nilai K dari eksperimen: [{currentExperiments.map(exp => exp.k).sort((a, b) => a - b).join(', ')}]...</span>
                      </div>
                      
                      <div className="bg-white p-4 rounded border border-teal-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Tahapan Analisis Elbow:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                            <span>Menghitung WCSS untuk setiap nilai K dari eksperimen</span>
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
                          <div className="text-blue-600 mt-0.5">📊</div>
                          <div>
                            <p className="text-sm text-blue-800 font-medium">
                              Analisis Berdasarkan Data yang Telah Difilter
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Elbow Method menggunakan data yang telah diproses dengan Smart One-Hot Encoding untuk hasil yang lebih akurat
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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