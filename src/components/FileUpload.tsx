import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File, separator?: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState<string>(',');
  const [showSeparatorSelector, setShowSeparatorSelector] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        
        // Determine if we need to show separator selector
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension === 'csv') {
          setShowSeparatorSelector(true);
          setSeparator(','); // Default for CSV
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          setShowSeparatorSelector(false);
          setSeparator(';'); // Default for Excel
          // Auto-upload Excel files since they don't need separator selection
          onFileUpload(file, ';');
        }
      }
    },
    [onFileUpload]
  );

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile, separator);
      setSelectedFile(null);
      setShowSeparatorSelector(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'csv') {
      return <FileText className="h-8 w-8 text-green-600" />;
    } else if (extension === 'xlsx' || extension === 'xls') {
      return <FileSpreadsheet className="h-8 w-8 text-blue-600" />;
    }
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-indigo-100 text-indigo-700 rounded-full">
            <Upload size={32} />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-indigo-600">Lepaskan file di sini...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Tarik dan lepaskan file atau klik untuk memilih
              </p>
              <p className="text-sm text-gray-500">
                Format file yang didukung: CSV, XLS, XLSX
              </p>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            {getFileIcon(selectedFile.name)}
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {showSeparatorSelector && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Separator CSV
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: ',', label: 'Koma (,)', desc: 'Default' },
                  { value: ';', label: 'Titik Koma (;)', desc: 'Excel Export' },
                  { value: '\t', label: 'Tab', desc: 'Tab-separated' },
                  { value: '|', label: 'Pipe (|)', desc: 'Alternative' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSeparator(option.value)}
                    className={`p-3 text-left border rounded-md transition-colors ${
                      separator === option.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            {showSeparatorSelector ? 'Upload dan Proses File' : 'File Berhasil Diupload'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;