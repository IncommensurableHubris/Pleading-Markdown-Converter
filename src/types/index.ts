export interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  models: string[];
}

export interface ConversionExample {
  id: string;
  name: string;
  originalText: string;
  convertedMarkdown: string;
  pleadingType: string;
}

export interface ConversionSettings {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  useExamples: boolean;
  selectedExamples: string[];
  customPrompt: string;
  customBaseUrl?: string;
  customModel?: string;
}

export interface DocumentInfo {
  filename: string;
  size: number;
  type: string;
  extractedText: string;
  convertedMarkdown?: string;
  processingTime?: number;
}

export interface ConversionResult {
  success: boolean;
  markdown?: string;
  error?: string;
  tokensUsed?: number;
  processingTime: number;
}