import React, { useCallback, useState } from 'react';
import { Upload, File, X, FileText, AlertCircle, Brain } from 'lucide-react';
import { FileProcessor } from '../utils/fileProcessing';
import { DocumentInfo, ConversionSettings } from '../types';

interface FileUploadProps {
  onFileProcessed: (document: DocumentInfo) => void;
  settings?: ConversionSettings;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, settings }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');

  const validateFileForPDF = useCallback((file: File): boolean => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf && settings) {
      const isConfigured = settings.provider === 'local' || settings.apiKey.trim().length > 0;
      if (!isConfigured) {
        setError('PDF processing requires LLM configuration. Please configure your LLM provider in settings first.');
        return false;
      }
    }
    return true;
  }, [settings]);

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!validateFileForPDF(file)) {
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProcessingStep('Processing file...');

    try {
      const extractedText = await FileProcessor.extractText(file, settings);
      
      const documentInfo: DocumentInfo = {
        filename: file.name,
        size: file.size,
        type: file.type,
        extractedText
      };

      onFileProcessed(documentInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onFileProcessed, settings, validateFileForPDF]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={handleChange}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isProcessing ? (processingStep || 'Processing document...') : 'Upload legal pleading'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop or click to select • TXT, DOCX, PDF • Max 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Supported formats:</p>
            <ul className="space-y-1 text-xs">
              <li><strong>TXT:</strong> Plain text documents</li>
              <li><strong>DOCX:</strong> Microsoft Word documents</li>
              <li><strong>PDF:</strong> OCRed PDF documents (requires LLM configuration)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PDF Processing Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Brain className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">PDF Processing:</p>
            <ul className="space-y-1 text-xs">
              <li>• PDFs must contain selectable text (OCRed)</li>
              <li>• LLM configuration required for text cleaning</li>
              <li>• Headers, footers, and artifacts automatically removed</li>
              <li>• Processing may take longer due to LLM text cleaning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};