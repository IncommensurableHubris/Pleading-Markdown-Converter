import React from 'react';
import { ArrowLeft, Settings, Key, Sliders, Brain, Server, Zap, AlertCircle, CheckCircle, Globe, Cpu } from 'lucide-react';
import { LLM_PROVIDERS } from '../utils/llmProviders';
import { ConversionSettings } from '../types';

interface SettingsPageProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSettingsChange,
  onBack
}) => {
  const selectedProvider = LLM_PROVIDERS.find(p => p.id === settings.provider);

  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const isLocalProvider = settings.provider === 'local';
  const hasApiKey = settings.apiKey.trim().length > 0;
  const isConfigured = isLocalProvider || hasApiKey;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Converter</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Ready</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Configuration Required</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* LLM Provider Configuration */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">LLM Provider Configuration</h2>
                  <p className="text-sm text-gray-500">Choose and configure your language model provider</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Provider Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Provider</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LLM_PROVIDERS.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => updateSetting('provider', provider.id)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        settings.provider === provider.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {provider.id === 'local' ? (
                          <Cpu className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Globe className="h-5 w-5 text-gray-600" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{provider.name}</h3>
                          <p className="text-xs text-gray-500">
                            {provider.requiresApiKey ? 'Requires API key' : 'No API key required'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Local LLM Setup Instructions */}
              {isLocalProvider && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Server className="h-6 w-6 text-blue-600 mt-0.5" />
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-blue-900 mb-2">Local LLM Setup Guide</h3>
                        <p className="text-sm text-blue-800 mb-3">
                          To use local LLMs, you need to run a compatible API server on your machine.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-blue-900 text-sm">Option 1: Ollama (Recommended)</h4>
                          <div className="bg-blue-100 rounded p-3 mt-2">
                            <code className="text-xs text-blue-800 block space-y-1">
                              <div># Install Ollama</div>
                              <div>curl -fsSL https://ollama.ai/install.sh | sh</div>
                              <div></div>
                              <div># Download a model (e.g., Llama 2)</div>
                              <div>ollama pull llama2</div>
                              <div></div>
                              <div># Start the server</div>
                              <div>ollama serve</div>
                            </code>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-blue-900 text-sm">Option 2: LM Studio</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            Download LM Studio, load a model, and start the local server on port 1234
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-blue-900 text-sm">Custom Base URL</h4>
                          <input
                            type="text"
                            value={settings.customBaseUrl || 'http://localhost:11434/v1'}
                            onChange={(e) => updateSetting('customBaseUrl', e.target.value)}
                            placeholder="http://localhost:11434/v1"
                            className="mt-1 w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Selection */}
              {selectedProvider && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Model</label>
                  {isLocalProvider ? (
                    <input
                      type="text"
                      value={settings.customModel || 'llama2'}
                      onChange={(e) => updateSetting('customModel', e.target.value)}
                      placeholder="Enter model name (e.g., llama2, codellama)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <select
                      value={settings.model}
                      onChange={(e) => updateSetting('model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedProvider.models.map(model => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* API Key */}
              {selectedProvider?.requiresApiKey && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-gray-700">API Key</label>
                  </div>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => updateSetting('apiKey', e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Your API key is stored locally and never sent to our servers
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <Sliders className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
                  <p className="text-sm text-gray-500">Fine-tune the conversion parameters</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused (0)</span>
                    <span className="font-medium">{settings.temperature}</span>
                    <span>Creative (1)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Lower values produce more consistent, focused output
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={settings.maxTokens}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum length of the generated response
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Custom Prompt</h2>
                  <p className="text-sm text-gray-500">Override the default conversion instructions</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={settings.customPrompt}
                onChange={(e) => updateSetting('customPrompt', e.target.value)}
                placeholder="Enter custom conversion instructions... (leave empty to use default Singapore legal pleading conversion prompt)"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to use the optimized default prompt for Singapore legal documents
              </p>
            </div>
          </div>

          {/* Configuration Status */}
          <div className={`rounded-lg border p-6 ${
            isConfigured 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start space-x-3">
              {isConfigured ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
              )}
              <div>
                <h3 className={`font-medium mb-2 ${
                  isConfigured ? 'text-green-900' : 'text-amber-900'
                }`}>
                  {isConfigured ? 'Configuration Complete' : 'Configuration Required'}
                </h3>
                <p className={`text-sm ${
                  isConfigured ? 'text-green-800' : 'text-amber-800'
                }`}>
                  {isConfigured 
                    ? 'Your LLM provider is configured and ready to convert legal documents.'
                    : isLocalProvider
                      ? 'Please ensure your local LLM server is running and accessible.'
                      : 'Please enter your API key to enable document conversion.'
                  }
                </p>
                
                {isConfigured && (
                  <div className="mt-3 text-sm">
                    <div className={`${isConfigured ? 'text-green-700' : 'text-amber-700'}`}>
                      <strong>Current Configuration:</strong>
                    </div>
                    <ul className={`mt-1 space-y-1 text-xs ${
                      isConfigured ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      <li>• Provider: {selectedProvider?.name}</li>
                      <li>• Model: {isLocalProvider ? (settings.customModel || 'custom') : settings.model}</li>
                      <li>• Temperature: {settings.temperature}</li>
                      <li>• Max Tokens: {settings.maxTokens}</li>
                      {isLocalProvider && (
                        <li>• Base URL: {settings.customBaseUrl || 'http://localhost:11434/v1'}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};