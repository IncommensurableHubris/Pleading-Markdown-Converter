import React, { useState } from 'react';
import { Download, Copy, Eye, EyeOff, CheckCircle, FileDown } from 'lucide-react';
import { DocumentInfo, ConversionResult } from '../types';

interface ConversionPreviewProps {
  docInfo: DocumentInfo | null;
  conversionResult: ConversionResult | null;
  isConverting: boolean;
}

export const ConversionPreview: React.FC<ConversionPreviewProps> = ({
  docInfo,
  conversionResult,
  isConverting
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'markdown'>('original');
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = async () => {
    if (conversionResult?.markdown) {
      await navigator.clipboard.writeText(conversionResult.markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const generateMarkdownFilename = (originalFilename: string): string => {
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    
    const cleanName = nameWithoutExt
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10);
    
    return `${cleanName}_converted_${timestamp}.md`;
  };

  const handleDownloadMarkdown = () => {
    if (conversionResult?.markdown && docInfo) {
      const filename = generateMarkdownFilename(docInfo.filename);
      
      const markdownContent = `<!-- 
Legal Document Conversion
Original File: ${docInfo.filename}
Converted: ${new Date().toISOString()}
Processing Time: ${conversionResult.processingTime}ms
${conversionResult.tokensUsed ? `Tokens Used: ${conversionResult.tokensUsed}` : ''}
-->

${conversionResult.markdown}`;

      const blob = new Blob([markdownContent], { 
        type: 'text/markdown;charset=utf-8' 
      });
      
      this.downloadBlob(blob, filename);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }
  };

  const handleDownloadOriginal = () => {
    if (docInfo) {
      const filename = docInfo.filename.replace(/\.[^/.]+$/, '_original.txt');
      const blob = new Blob([docInfo.extractedText], { 
        type: 'text/plain;charset=utf-8' 
      });
      
      this.downloadBlob(blob, filename);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMarkdownPreview = (markdown: string) => {
    return markdown
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>');
  };

  if (!docInfo) {
    return (
      <div className="bg-white border rounded-lg shadow-sm p-8 text-center">
        <Eye className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Upload a document to see the preview</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{docInfo.filename}</h3>
            <p className="text-sm text-gray-500">
              {(docInfo.size / 1024).toFixed(1)} KB • {docInfo.extractedText.length} characters
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Copy Button */}
            {conversionResult?.success && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                title="Copy markdown to clipboard"
              >
                {copySuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
            
            {/* Download Original Text */}
            <button
              onClick={handleDownloadOriginal}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              title="Download original extracted text"
            >
              <FileDown className="h-4 w-4" />
              <span>Original</span>
            </button>
            
            {/* Download Markdown */}
            {conversionResult?.success && (
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                title="Download converted markdown file"
              >
                {downloadSuccess ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{downloadSuccess ? 'Downloaded!' : 'Markdown'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'original'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Original Text
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            disabled={isConverting || !conversionResult}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isConverting || !conversionResult
                ? 'text-gray-400 cursor-not-allowed opacity-50'
                : activeTab === 'markdown'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Converted Markdown
          </button>
          {conversionResult?.success && activeTab === 'markdown' && (
            <button
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showRawMarkdown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showRawMarkdown ? 'Preview' : 'Raw'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isConverting && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Converting to markdown...</p>
            </div>
          </div>
        )}

        {!isConverting && activeTab === 'original' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {docInfo.extractedText}
              </pre>
            </div>
            
            {/* Original text info */}
            <div className="flex justify-between text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <span>Extracted and cleaned text (headers/footers removed)</span>
              <span>{docInfo.extractedText.split('\n').length} lines</span>
            </div>
          </div>
        )}

        {!isConverting && activeTab === 'markdown' && conversionResult && (
          <div>
            {conversionResult.success ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {showRawMarkdown ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {conversionResult.markdown}
                    </pre>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-em:text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownPreview(conversionResult.markdown || '')
                      }}
                    />
                  )}
                </div>

                {/* Prominent Download Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    {downloadSuccess ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Downloaded Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>Download Markdown File</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Conversion Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium">Processing Time</span>
                      <span className="text-green-600">{conversionResult.processingTime}ms</span>
                    </div>
                  </div>
                  
                  {conversionResult.tokensUsed && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 font-medium">Tokens Used</span>
                        <span className="text-blue-600">{conversionResult.tokensUsed}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <FileDown className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Export Options:</p>
                      <ul className="space-y-1 text-xs">
                        <li><strong>Copy:</strong> Copy markdown text to clipboard for immediate use</li>
                        <li><strong>Original:</strong> Download the cleaned original text (headers/footers removed)</li>
                        <li><strong>Markdown:</strong> Download the converted markdown file with metadata</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">Conversion failed</p>
                <p className="text-red-600 text-sm">{conversionResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};