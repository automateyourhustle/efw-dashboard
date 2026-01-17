import React, { useCallback, useState } from 'react';
import { Upload, FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface DataUploaderProps {
  onDataUpload: (csvText: string, fileName?: string) => Promise<{ success: boolean; error?: string }>;
  hasExistingData: boolean;
}

export function DataUploader({ onDataUpload, hasExistingData }: DataUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      try {
        const result = await onDataUpload(csvText, file.name);
        if (!result.success) {
          setUploadError(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading CSV:', error);
        setUploadError('Error processing CSV file. Please check the format and try again.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  }, [onDataUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      setUploadError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        try {
          const result = await onDataUpload(csvText, file.name);
          if (!result.success) {
            setUploadError(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Error uploading CSV:', error);
          setUploadError('Error processing CSV file. Please check the format and try again.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {hasExistingData ? 'Update Sales Data' : 'Upload Sales Data'}
        </h3>
        {hasExistingData && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Data loaded</span>
          </div>
        )}
      </div>

      {hasExistingData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Update Existing Data</h4>
              <p className="text-sm text-blue-700 mt-1">
                Uploading a new file will replace all current data with the latest sales information.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isUploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('csv-upload')?.click()}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">Processing...</h4>
              <p className="text-gray-600">Uploading and parsing your CSV file</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                {hasExistingData ? 'Upload New CSV File' : 'Upload CSV File'}
              </h4>
              <p className="text-gray-600">
                Drag and drop your CSV file here, or click to select
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Upload className="w-4 h-4" />
              <span>Supports CSV files up to 10MB</span>
            </div>
          </div>
        )}

        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {uploadError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {!hasExistingData && (
        <div className="mt-6 text-center">
          <button
            onClick={() => !isUploading && document.getElementById('csv-upload')?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select File
          </button>
        </div>
      )}
    </div>
  );
}