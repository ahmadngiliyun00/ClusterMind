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
 * Mengubah data kategorikal menjadi numerik menggunakan label encoding
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
 * Formula: (x - min) / (max - min)
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

  console.log('=== MIN-MAX NORMALIZATION ===');
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
 * Normalisasi data numerik menggunakan Z-score transformation (standardization)
 * Formula: (x - mean) / std
 */
export function zScoreNormalization(
  data: DataPoint[],
  numericalColumns: string[]
): {
  normalizedData: DataPoint[];
  columnStats: { [key: string]: ColumnStats };
} {
  const columnStats: { [key: string]: ColumnStats } = {};
  const normalizedData = data.map(row => ({ ...row })); // Deep copy

  console.log('=== Z-SCORE NORMALIZATION ===');
  console.log(`Normalizing ${numericalColumns.length} columns:`, numericalColumns);

  numericalColumns.forEach(column => {
    // Hitung mean dan standard deviation
    const values = data.map(row => Number(row[column]) || 0).filter(val => isFinite(val));
    
    if (values.length === 0) {
      columnStats[column] = { mean: 0, std: 1, min: 0, max: 1 };
      return;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    columnStats[column] = { mean, std, min, max };
    
    console.log(`Column ${column}: mean=${mean.toFixed(3)}, std=${std.toFixed(3)}`);

    // Z-score normalization: (x - mean) / std
    normalizedData.forEach(row => {
      const value = Number(row[column]) || 0;
      if (std === 0) {
        row[column] = 0; // Jika std = 0, semua nilai sama
      } else {
        row[column] = (value - mean) / std;
      }
    });
  });

  return { normalizedData, columnStats };
}

/**
 * Fungsi utama untuk melakukan pra-pemrosesan data dengan Min-Max normalization
 */
export function preprocessData(data: DataPoint[]): {
  processedData: DataPoint[];
  encodingMaps: EncodingMap;
  columnStats: { [key: string]: ColumnStats };
  categoricalColumns: string[];
  numericalColumns: string[];
} {
  // Identifikasi tipe kolom
  const { categoricalColumns, numericalColumns } = identifyColumnTypes(data);

  // Label encoding untuk kolom kategorikal
  const { encodedData, encodingMaps } = labelEncoding(data, categoricalColumns);

  // Min-Max normalization untuk semua kolom numerik (termasuk hasil encoding)
  const columnsToNormalize = [...numericalColumns, ...categoricalColumns];
  const { normalizedData, columnStats } = minMaxNormalization(encodedData, columnsToNormalize);

  return {
    processedData: normalizedData,
    encodingMaps,
    columnStats,
    categoricalColumns,
    numericalColumns
  };
}

/**
 * Perform nominal to numerical conversion
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
 * Perform Min-Max normalization on numerical data (NEW DEFAULT)
 */
export async function performNormalization(numericalData: ParsedData): Promise<ParsedData> {
  console.log('\n=== SWITCHING TO MIN-MAX NORMALIZATION ===');
  console.log('Using Min-Max scaling (0-1) instead of Z-score normalization');
  
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

/**
 * Alternative function for Z-score normalization (if needed)
 */
export async function performZScoreNormalization(numericalData: ParsedData): Promise<ParsedData> {
  const { normalizedData, columnStats } = zScoreNormalization(
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