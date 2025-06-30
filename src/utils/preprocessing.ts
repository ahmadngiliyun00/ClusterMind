import { DataPoint, ParsedData } from './csv';

// Interface untuk menyimpan hasil encoding
export interface EncodingMap {
  [key: string]: {
    [value: string]: number;
  };
}

// Interface untuk menyimpan statistik kolom numerik
export interface ColumnStats {
  mean: number;
  std: number;
  min?: number;
  max?: number;
}

// Interface untuk validasi data clustering
export interface DataValidationResult {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  cardinalityInfo: { [column: string]: number };
  totalFeatures: number;
  sparsityRatio: number;
}

/**
 * Identify column types from data
 */
export function identifyColumnTypes(data: DataPoint[]): {
  categoricalColumns: string[];
  numericalColumns: string[];
} {
  if (!data || data.length === 0) {
    return { categoricalColumns: [], numericalColumns: [] };
  }

  const columns = Object.keys(data[0]);
  const categoricalColumns: string[] = [];
  const numericalColumns: string[] = [];

  columns.forEach(column => {
    // Skip kolom id dan cluster
    if (column === 'id' || column === 'cluster') return;

    // Cek tipe data kolom berdasarkan sampel data
    const sampleValues = data.slice(0, Math.min(100, data.length))
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined && val !== '');

    if (sampleValues.length === 0) return;

    // Cek apakah semua nilai bisa dikonversi ke number
    const isNumeric = sampleValues.every(val => {
      const num = Number(val);
      return !isNaN(num) && isFinite(num);
    });

    if (isNumeric) {
      numericalColumns.push(column);
    } else {
      categoricalColumns.push(column);
    }
  });

  return { categoricalColumns, numericalColumns };
}

/**
 * Analyze cardinality and clustering suitability of categorical columns
 */
export function analyzeDataForClustering(data: DataPoint[], categoricalColumns: string[]): DataValidationResult {
  console.log('\n🔍 ANALYZING DATA SUITABILITY FOR CLUSTERING');
  console.log('='.repeat(60));
  
  const cardinalityInfo: { [column: string]: number } = {};
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let totalPotentialFeatures = 0;
  
  // Analyze each categorical column
  categoricalColumns.forEach(column => {
    const uniqueValues = new Set(data.map(row => String(row[column] || '')));
    const cardinality = uniqueValues.size;
    cardinalityInfo[column] = cardinality;
    totalPotentialFeatures += cardinality;
    
    console.log(`📊 Column "${column}": ${cardinality} unique values`);
    
    // High cardinality warning
    if (cardinality > 50) {
      warnings.push(`Kolom "${column}" memiliki ${cardinality} nilai unik (sangat tinggi)`);
      recommendations.push(`Pertimbangkan untuk menghapus atau mengelompokkan kolom "${column}"`);
    } else if (cardinality > 20) {
      warnings.push(`Kolom "${column}" memiliki ${cardinality} nilai unik (tinggi)`);
    }
    
    // Near-unique data warning
    const uniquenessRatio = cardinality / data.length;
    if (uniquenessRatio > 0.8) {
      warnings.push(`Kolom "${column}" hampir unik (${(uniquenessRatio * 100).toFixed(1)}% dari data)`);
      recommendations.push(`Kolom "${column}" tidak cocok untuk clustering karena terlalu unik`);
    }
  });
  
  // Calculate sparsity ratio
  const sparsityRatio = totalPotentialFeatures / data.length;
  
  console.log(`\n📈 CLUSTERING SUITABILITY ANALYSIS:`);
  console.log(`   Total potential features after One-Hot: ${totalPotentialFeatures}`);
  console.log(`   Data rows: ${data.length}`);
  console.log(`   Sparsity ratio: ${sparsityRatio.toFixed(2)} (features/rows)`);
  
  // Overall assessment
  let isValid = true;
  
  if (sparsityRatio > 5) {
    isValid = false;
    warnings.push(`Data akan menjadi sangat sparse (${sparsityRatio.toFixed(1)} fitur per baris)`);
    recommendations.push('Kurangi jumlah kolom kategorikal atau gunakan teknik dimensionality reduction');
  }
  
  if (totalPotentialFeatures > 1000) {
    isValid = false;
    warnings.push(`Terlalu banyak fitur setelah One-Hot Encoding (${totalPotentialFeatures})`);
    recommendations.push('Pilih hanya kolom dengan cardinality rendah untuk clustering');
  }
  
  // Specific recommendations
  if (warnings.length > 0) {
    recommendations.push('Gunakan hanya kolom dengan sedikit kategori (seperti: prodi, kelamin, jalur, status)');
    recommendations.push('Hindari kolom dengan banyak nilai unik (seperti: sekolah, kelurahan, kecamatan)');
  }
  
  console.log(`\n${isValid ? '✅' : '❌'} Overall assessment: ${isValid ? 'SUITABLE' : 'NOT SUITABLE'} for clustering`);
  
  return {
    isValid,
    warnings,
    recommendations,
    cardinalityInfo,
    totalFeatures: totalPotentialFeatures,
    sparsityRatio
  };
}

/**
 * Filter columns based on cardinality for better clustering
 */
export function filterColumnsForClustering(
  data: DataPoint[], 
  categoricalColumns: string[], 
  maxCardinality: number = 10
): {
  suitableColumns: string[];
  excludedColumns: string[];
  cardinalityInfo: { [column: string]: number };
} {
  console.log('\n🔧 FILTERING COLUMNS FOR CLUSTERING');
  console.log(`Max cardinality threshold: ${maxCardinality}`);
  console.log('='.repeat(50));
  
  const suitableColumns: string[] = [];
  const excludedColumns: string[] = [];
  const cardinalityInfo: { [column: string]: number } = {};
  
  categoricalColumns.forEach(column => {
    const uniqueValues = new Set(data.map(row => String(row[column] || '')));
    const cardinality = uniqueValues.size;
    cardinalityInfo[column] = cardinality;
    
    if (cardinality <= maxCardinality) {
      suitableColumns.push(column);
      console.log(`✅ "${column}": ${cardinality} values - INCLUDED`);
    } else {
      excludedColumns.push(column);
      console.log(`❌ "${column}": ${cardinality} values - EXCLUDED (too high cardinality)`);
    }
  });
  
  console.log(`\nFiltering result:`);
  console.log(`  Suitable columns: ${suitableColumns.length}`);
  console.log(`  Excluded columns: ${excludedColumns.length}`);
  
  return { suitableColumns, excludedColumns, cardinalityInfo };
}

/**
 * Smart One-Hot Encoding with cardinality filtering
 */
export function smartOneHotEncoding(
  data: DataPoint[], 
  categoricalColumns: string[],
  maxCardinality: number = 10
): {
  encodedData: DataPoint[];
  encodingMaps: EncodingMap;
  newColumns: string[];
  excludedColumns: string[];
  validationResult: DataValidationResult;
} {
  console.log('\n🧠 SMART ONE-HOT ENCODING');
  console.log('='.repeat(50));
  
  // First, analyze data suitability
  const validationResult = analyzeDataForClustering(data, categoricalColumns);
  
  // Filter columns based on cardinality
  const { suitableColumns, excludedColumns } = filterColumnsForClustering(
    data, 
    categoricalColumns, 
    maxCardinality
  );
  
  if (suitableColumns.length === 0) {
    console.log('⚠️  No suitable categorical columns found for clustering');
    return {
      encodedData: data.map(row => ({ ...row })),
      encodingMaps: {},
      newColumns: [],
      excludedColumns,
      validationResult
    };
  }
  
  // Perform One-Hot Encoding only on suitable columns
  const { encodedData, encodingMaps, newColumns } = oneHotEncoding(data, suitableColumns);
  
  // Remove excluded categorical columns from the data
  excludedColumns.forEach(column => {
    encodedData.forEach(row => {
      delete row[column];
    });
  });
  
  console.log(`\n✅ Smart One-Hot Encoding completed:`);
  console.log(`   Processed columns: ${suitableColumns.length}`);
  console.log(`   Excluded columns: ${excludedColumns.length}`);
  console.log(`   New binary features: ${newColumns.length}`);
  
  return { encodedData, encodingMaps, newColumns, excludedColumns, validationResult };
}

/**
 * One-Hot Encoding untuk data kategorikal (original function)
 */
export function oneHotEncoding(data: DataPoint[], categoricalColumns: string[]): {
  encodedData: DataPoint[];
  encodingMaps: EncodingMap;
  newColumns: string[];
} {
  console.log('\n=== ONE-HOT ENCODING ===');
  console.log(`Processing ${categoricalColumns.length} categorical columns:`, categoricalColumns);
  
  const encodingMaps: EncodingMap = {};
  const newColumns: string[] = [];
  
  // Buat copy data
  const encodedData = data.map(row => ({ ...row }));

  categoricalColumns.forEach(column => {
    console.log(`\nProcessing column: ${column}`);
    
    // Kumpulkan nilai unik dan urutkan
    const uniqueValues = [...new Set(data.map(row => String(row[column] || '')))].sort();
    console.log(`  Unique values (${uniqueValues.length}):`, uniqueValues.slice(0, 5), uniqueValues.length > 5 ? '...' : '');
    
    // Buat mapping nilai ke kolom baru
    encodingMaps[column] = {};
    
    uniqueValues.forEach(value => {
      const newColumnName = `${column}_${value.replace(/[^a-zA-Z0-9]/g, '_')}`;
      newColumns.push(newColumnName);
      encodingMaps[column][value] = newColumnName;
      
      // Inisialisasi kolom baru dengan 0 untuk semua baris
      encodedData.forEach(row => {
        row[newColumnName] = 0;
      });
    });

    // Set nilai 1 untuk kategori yang sesuai
    encodedData.forEach(row => {
      const originalValue = String(row[column] || '');
      const newColumnName = encodingMaps[column][originalValue];
      if (newColumnName) {
        row[newColumnName] = 1;
      }
      
      // Hapus kolom asli
      delete row[column];
    });
    
    console.log(`  Created ${uniqueValues.length} new binary columns`);
  });

  console.log(`\nOne-Hot Encoding completed:`);
  console.log(`  Original categorical columns: ${categoricalColumns.length}`);
  console.log(`  New binary columns: ${newColumns.length}`);
  console.log(`  Sample new columns:`, newColumns.slice(0, 5));

  return { encodedData, encodingMaps, newColumns };
}

/**
 * Label Encoding untuk data kategorikal (metode lama)
 */
export function labelEncoding(data: DataPoint[], categoricalColumns: string[]): {
  encodedData: DataPoint[];
  encodingMaps: EncodingMap;
} {
  const encodingMaps: EncodingMap = {};
  const encodedData = data.map(row => ({ ...row })); // Deep copy

  categoricalColumns.forEach(column => {
    // Kumpulkan nilai unik dan urutkan
    const uniqueValues = [...new Set(data.map(row => String(row[column] || '')))].sort();
    
    // Buat mapping nilai ke angka
    encodingMaps[column] = {};
    uniqueValues.forEach((value, index) => {
      encodingMaps[column][value] = index;
    });

    // Encode data
    encodedData.forEach(row => {
      const originalValue = String(row[column] || '');
      row[column] = encodingMaps[column][originalValue] || 0;
    });
  });

  return { encodedData, encodingMaps };
}

/**
 * Normalisasi data numerik menggunakan Min-Max scaling (0-1 normalization)
 */
export function minMaxNormalization(
  data: DataPoint[],
  numericalColumns: string[]
): {
  normalizedData: DataPoint[];
  columnStats: { [key: string]: ColumnStats };
} {
  const columnStats: { [key: string]: ColumnStats } = {};
  const normalizedData = data.map(row => ({ ...row })); // Deep copy

  console.log('\n=== MIN-MAX NORMALIZATION ===');
  console.log(`Normalizing ${numericalColumns.length} columns:`, numericalColumns);

  numericalColumns.forEach(column => {
    // Hitung min dan max
    const values = data.map(row => Number(row[column]) || 0).filter(val => isFinite(val));
    
    if (values.length === 0) {
      columnStats[column] = { mean: 0, std: 1, min: 0, max: 1 };
      console.log(`Column ${column}: No valid values, using defaults`);
      return;
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    columnStats[column] = { mean, std, min, max };
    
    console.log(`Column ${column}: min=${min.toFixed(3)}, max=${max.toFixed(3)}, range=${(max-min).toFixed(3)}`);

    // Min-Max normalization: (x - min) / (max - min)
    normalizedData.forEach(row => {
      const value = Number(row[column]) || 0;
      if (max - min === 0) {
        row[column] = 0; // Jika semua nilai sama
      } else {
        const normalized = (value - min) / (max - min);
        row[column] = normalized;
      }
    });
  });

  // Log sample of normalized data
  console.log('Sample normalized values:');
  numericalColumns.slice(0, 3).forEach(column => {
    const sampleValues = normalizedData.slice(0, 5).map(row => Number(row[column]).toFixed(3));
    console.log(`${column}: [${sampleValues.join(', ')}]`);
  });

  return { normalizedData, columnStats };
}

/**
 * Perform smart One-Hot Encoding with validation and filtering
 */
export async function performOneHotEncoding(rawData: ParsedData): Promise<ParsedData & { 
  validationResult?: DataValidationResult;
  excludedColumns?: string[];
}> {
  const { categoricalColumns, numericalColumns } = identifyColumnTypes(rawData.data);
  
  if (categoricalColumns.length === 0) {
    // No categorical columns to convert
    return {
      ...rawData,
      numericalColumns: [...numericalColumns],
      categoricalColumns: []
    };
  }
  
  // Use smart One-Hot Encoding with cardinality filtering
  const { 
    encodedData, 
    encodingMaps, 
    newColumns, 
    excludedColumns, 
    validationResult 
  } = smartOneHotEncoding(rawData.data, categoricalColumns, 10); // Max 10 unique values per column
  
  // Update headers: remove excluded categorical columns, keep numerical, add new binary columns
  const newHeaders = rawData.headers
    .filter(h => !excludedColumns.includes(h)) // Remove excluded categorical columns
    .filter(h => !categoricalColumns.includes(h) || numericalColumns.includes(h)) // Keep only numerical
    .concat(newColumns); // Add new binary columns
  
  // All columns are now numerical
  const allNumericalColumns = [...numericalColumns, ...newColumns];
  
  return {
    data: encodedData,
    headers: newHeaders,
    numericalColumns: allNumericalColumns,
    categoricalColumns: [], // No more categorical columns
    encodingMaps,
    columnStats: rawData.columnStats,
    validationResult,
    excludedColumns
  };
}

/**
 * Perform nominal to numerical conversion with Label Encoding (metode lama)
 */
export async function performNominalToNumerical(rawData: ParsedData): Promise<ParsedData> {
  const { categoricalColumns, numericalColumns } = identifyColumnTypes(rawData.data);
  
  if (categoricalColumns.length === 0) {
    // No categorical columns to convert
    return {
      ...rawData,
      numericalColumns: [...numericalColumns],
      categoricalColumns: []
    };
  }
  
  // Label encoding untuk kolom kategorikal
  const { encodedData, encodingMaps } = labelEncoding(rawData.data, categoricalColumns);
  
  // Semua kolom sekarang menjadi numerik
  const allNumericalColumns = [...numericalColumns, ...categoricalColumns];
  
  return {
    data: encodedData,
    headers: rawData.headers,
    numericalColumns: allNumericalColumns,
    categoricalColumns: [], // Tidak ada lagi kolom kategorikal
    encodingMaps,
    columnStats: rawData.columnStats
  };
}

/**
 * Perform Min-Max normalization on numerical data
 */
export async function performNormalization(numericalData: ParsedData): Promise<ParsedData> {
  console.log('\n=== NORMALIZATION STEP ===');
  console.log('Note: For One-Hot Encoded data, normalization is usually not needed');
  console.log('One-Hot Encoding already produces binary values (0,1) in the same scale');
  
  // Cek apakah data sudah dalam bentuk binary (hasil One-Hot Encoding)
  const sampleValues = numericalData.data.slice(0, 10);
  const isBinaryData = sampleValues.every(row => 
    numericalData.numericalColumns.every(col => {
      const val = Number(row[col]);
      return val === 0 || val === 1 || isNaN(val);
    })
  );
  
  if (isBinaryData) {
    console.log('✅ Data appears to be binary (One-Hot Encoded) - skipping normalization');
    return numericalData;
  }
  
  console.log('🔄 Data contains non-binary values - applying Min-Max normalization');
  
  const { normalizedData, columnStats } = minMaxNormalization(
    numericalData.data,
    numericalData.numericalColumns
  );
  
  return {
    data: normalizedData,
    headers: numericalData.headers,
    numericalColumns: numericalData.numericalColumns,
    categoricalColumns: numericalData.categoricalColumns,
    encodingMaps: numericalData.encodingMaps,
    columnStats
  };
}