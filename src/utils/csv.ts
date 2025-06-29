import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { preprocessData } from './preprocessing';

export interface DataPoint {
  [key: string]: any;
  id?: number;
  cluster?: number;
}

export interface ParsedData {
  data: DataPoint[];
  headers: string[];
  numericalColumns: string[];
  categoricalColumns: string[];
  encodingMaps?: any;
  columnStats?: any;
}

/**
 * Parse Excel file (XLS/XLSX) and return the data as an array of objects
 */
const parseExcel = (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error('File Excel kosong');
        }
        
        // Extract headers from first row
        const headers = jsonData[0] as string[];
        
        // Convert remaining rows to objects
        const dataRows = jsonData.slice(1).map((row: any[], index) => {
          const obj: any = { id: index };
          headers.forEach((header, i) => {
            obj[header] = row[i] !== undefined ? row[i] : null;
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val !== null && val !== undefined && val !== ''));

        // Preprocess data
        const {
          processedData,
          encodingMaps,
          columnStats,
          categoricalColumns,
          numericalColumns
        } = preprocessData(dataRows);

        resolve({
          data: processedData,
          headers,
          numericalColumns,
          categoricalColumns,
          encodingMaps,
          columnStats
        });
      } catch (error) {
        reject(new Error('Gagal memproses file Excel: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Gagal membaca file Excel'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse CSV file and return the data as an array of objects
 */
const parseCSV = (file: File, separator: string = ','): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      delimiter: separator,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          // Add ID to each data point
          const data = results.data
            .filter((row) => Object.values(row).some((val) => val !== null && val !== undefined && val !== ''))
            .map((row, index) => ({ ...row, id: index }));

          if (data.length === 0) {
            throw new Error('File CSV kosong atau tidak valid');
          }

          // Extract headers
          const headers = results.meta.fields || [];

          if (headers.length === 0) {
            throw new Error('Tidak dapat menemukan header dalam file CSV');
          }

          // Preprocess data
          const {
            processedData,
            encodingMaps,
            columnStats,
            categoricalColumns,
            numericalColumns
          } = preprocessData(data);

          resolve({
            data: processedData,
            headers,
            numericalColumns,
            categoricalColumns,
            encodingMaps,
            columnStats
          });
        } catch (error) {
          reject(new Error('Gagal memproses data CSV: ' + (error as Error).message));
        }
      },
      error: (error) => {
        reject(new Error('Gagal parsing CSV: ' + error.message));
      },
    });
  });
};

/**
 * Parse file based on its extension
 */
export const parseFile = (file: File, separator?: string): Promise<ParsedData> => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSV(file, separator || ',');
    case 'xls':
    case 'xlsx':
      return parseExcel(file);
    default:
      return Promise.reject(new Error('Format file tidak didukung. Gunakan CSV, XLS, atau XLSX.'));
  }
};

/**
 * Download data as a CSV file
 */
export const downloadCSV = (data: DataPoint[], filename: string): void => {
  // Convert data to CSV string using Papa.unparse
  const csv = Papa.unparse(data);
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.href = url;
  link.setAttribute('download', filename);
  
  // Append link to document, trigger click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up by revoking the Blob URL
  URL.revokeObjectURL(url);
};