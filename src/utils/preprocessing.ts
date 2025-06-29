import { DataPoint, ParsedData } from './csv';

// Interface untuk menyimpan hasil encoding
export interface EncodingMap {
  [key: string]: {
    [value: string]: number;
  };
}

// Interface untuk menyimpan statistik kolom numerik
export interface ColumnStats {
  min: number;
  max: number;
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
 * Normalisasi data numerik menggunakan min-max scaling
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

  numericalColumns.forEach(column => {
    // Hitung min dan max
    const values = data.map(row => Number(row[column]) || 0).filter(val => isFinite(val));
    
    if (values.length === 0) {
      columnStats[column] = { min: 0, max: 1 };
      return;
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    columnStats[column] = { min, max };

    // Normalisasi data
    normalizedData.forEach(row => {
      const value = Number(row[column]) || 0;
      if (max - min === 0) {
        row[column] = 0;
      } else {
        row[column] = (value - min) / (max - min);
      }
    });
  });

  return { normalizedData, columnStats };
}

/**
 * Fungsi utama untuk melakukan pra-pemrosesan data
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

  // Normalisasi untuk semua kolom numerik (termasuk hasil encoding)
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
 * Perform normalization on numerical data
 */
export async function performNormalization(numericalData: ParsedData): Promise<ParsedData> {
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