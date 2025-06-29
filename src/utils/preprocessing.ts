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
 * Mengubah data kategorikal menjadi numerik menggunakan label encoding
 */
export function labelEncoding(data: DataPoint[], categoricalColumns: string[]): {
  encodedData: DataPoint[];
  encodingMaps: EncodingMap;
} {
  const encodingMaps: EncodingMap = {};
  const encodedData = [...data];

  categoricalColumns.forEach(column => {
    // Kumpulkan nilai unik dan urutkan
    const uniqueValues = [...new Set(data.map(row => row[column]))].sort();
    
    // Buat mapping nilai ke angka
    encodingMaps[column] = {};
    uniqueValues.forEach((value, index) => {
      encodingMaps[column][value] = index;
    });

    // Encode data
    encodedData.forEach(row => {
      row[column] = encodingMaps[column][row[column]];
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
  const normalizedData = [...data];

  numericalColumns.forEach(column => {
    // Hitung min dan max
    const values = data.map(row => row[column]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    columnStats[column] = { min, max };

    // Normalisasi data
    normalizedData.forEach(row => {
      if (max - min === 0) {
        row[column] = 0;
      } else {
        row[column] = (row[column] - min) / (max - min);
      }
    });
  });

  return { normalizedData, columnStats };
}

/**
 * Identifikasi kolom kategorikal dan numerik dari data
 */
export function identifyColumnTypes(data: DataPoint[]): {
  categoricalColumns: string[];
  numericalColumns: string[];
} {
  const columns = Object.keys(data[0]);
  const categoricalColumns: string[] = [];
  const numericalColumns: string[] = [];

  columns.forEach(column => {
    // Skip kolom id dan cluster
    if (column === 'id' || column === 'cluster') return;

    // Cek tipe data kolom
    const isNumeric = data.every(row => 
      typeof row[column] === 'number' && !isNaN(row[column])
    );

    if (isNumeric) {
      numericalColumns.push(column);
    } else {
      categoricalColumns.push(column);
    }
  });

  return { categoricalColumns, numericalColumns };
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