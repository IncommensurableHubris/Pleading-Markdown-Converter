import React, { useState, useEffect } from 'react';
import { Scale, Settings, FileText, Brain, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { SettingsPage } from './components/SettingsPage';
import { ExamplesManager } from './components/ExamplesManager';
import { ConversionPreview } from './components/ConversionPreview';
import { LLMService } from './utils/llmProviders';
import { DocumentInfo, ConversionSettings, ConversionExample, ConversionResult } from './types';

const DEFAULT_SETTINGS: ConversionSettings = {
  provider: 'local',
  model: 'llama2',
  apiKey: '',
  temperature: 0.1,
  maxTokens: 4000,
  useExamples: false,
  selectedExamples: [],
  customPrompt: '',
  customBaseUrl: 'http://localhost:11434/v1',
  customModel: 'llama2'
};

function App() {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [examples, setExamples] = useState<ConversionExample[]>([]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('legalConverterSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      const savedExamples = localStorage.getItem('legalConverterExamples');
      if (savedExamples) {
        setExamples(JSON.parse(savedExamples));
      }
    } catch (error) {
      console.warn('Failed to load saved settings:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('legalConverterSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, [settings]);

  // Save examples to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('legalConverterExamples', JSON.stringify(examples));
    } catch (error) {
      console.warn('Failed to save examples:', error);
    }
  }, [examples]);

  const handleFileProcessed = (docInfo: DocumentInfo) => {
    setDocument(docInfo);
    setConversionResult(null);
  };

  const isConfigured = settings.provider === 'local' || settings.apiKey.trim().length > 0;

  const handleConvert = async () => {
    if (!document || !isConfigured) {
      if (!isConfigured) {
        setShowSettings(true);
      }
      return;
    }

    setIsConverting(true);
    setConversionResult(null);

    try {
      const selectedExampleData = settings.useExamples 
        ? examples.filter(ex => settings.selectedExamples.includes(ex.id))
        : [];

      const result = await LLMService.convertToMarkdown(
        document.extractedText,
        settings,
        selectedExampleData
      );

      setConversionResult(result);
    } catch (error) {
      setConversionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: 0
      });
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = document && !isConverting;

  if (showSettings) {
    return (
      <SettingsPage
        settings={settings}
        onSettingsChange={setSettings}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Legal Pleading Converter
                </h1>
                <p className="text-sm text-gray-500">
                  Singapore Civil Litigation • Markdown Export
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Brain className="h-4 w-4" />
                <span>{settings.provider === 'local' ? 'Local LLM' : settings.provider}</span>
                <span>•</span>
                <span>{settings.provider === 'local' ? (settings.customModel || 'custom') : settings.model}</span>
                {isConfigured ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs">Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-xs">Setup Required</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
              </div>
              <FileUpload 
                onFileProcessed={handleFileProcessed}
                settings={settings}
              />
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                canConvert
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Zap className="h-5 w-5" />
              <span>{isConverting ? 'Converting...' : 'Convert to Markdown'}</span>
            </button>

            {!isConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Configuration Required:</strong> Please configure your LLM provider in settings to enable conversion.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
                >
                  Open Settings →
                </button>
              </div>
            )}
          </div>

          {/* Middle Column - Examples */}
          <div className="space-y-6">
            <ExamplesManager
              examples={examples}
              selectedExamples={settings.selectedExamples}
              onExamplesChange={setExamples}
              onSelectionChange={(ids) => setSettings({ ...settings, selectedExamples: ids })}
              useExamples={settings.useExamples}
              onUseExamplesChange={(use) => setSettings({ ...settings, useExamples: use })}
            />
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <ConversionPreview
              docInfo={document}
              conversionResult={conversionResult}
              isConverting={isConverting}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Legal Pleading Converter for Singapore Civil Litigation</p>
            <p className="mt-1">Converts legal documents to markdown format using advanced LLM prompting</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;