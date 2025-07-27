import { describe, it, expect } from 'vitest';
import { ConversionSettings, DocumentInfo, ConversionResult, ConversionExample, LLMProvider } from '../types';

describe('Type Definitions', () => {
  it('should have correct ConversionSettings structure', () => {
    const settings: ConversionSettings = {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
      temperature: 0.5,
      maxTokens: 2000,
      useExamples: true,
      selectedExamples: ['1', '2'],
      customPrompt: 'Custom prompt',
      customBaseUrl: 'http://localhost:8080',
      customModel: 'custom-model'
    };

    expect(settings.provider).toBe('openai');
    expect(settings.temperature).toBe(0.5);
    expect(settings.useExamples).toBe(true);
    expect(settings.selectedExamples).toHaveLength(2);
  });

  it('should have correct DocumentInfo structure', () => {
    const docInfo: DocumentInfo = {
      filename: 'test.pdf',
      size: 1024,
      type: 'application/pdf',
      extractedText: 'extracted text',
      convertedMarkdown: '# Converted',
      processingTime: 1500
    };

    expect(docInfo.filename).toBe('test.pdf');
    expect(docInfo.size).toBe(1024);
    expect(docInfo.processingTime).toBe(1500);
  });

  it('should have correct ConversionResult structure', () => {
    const successResult: ConversionResult = {
      success: true,
      markdown: '# Result',
      tokensUsed: 100,
      processingTime: 2000
    };

    const errorResult: ConversionResult = {
      success: false,
      error: 'Conversion failed',
      processingTime: 500
    };

    expect(successResult.success).toBe(true);
    expect(successResult.markdown).toBe('# Result');
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBe('Conversion failed');
  });

  it('should have correct ConversionExample structure', () => {
    const example: ConversionExample = {
      id: '123',
      name: 'Example 1',
      originalText: 'Original',
      convertedMarkdown: '# Converted',
      pleadingType: 'Statement of Claim'
    };

    expect(example.id).toBe('123');
    expect(example.pleadingType).toBe('Statement of Claim');
  });

  it('should have correct LLMProvider structure', () => {
    const provider: LLMProvider = {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      requiresApiKey: true,
      models: ['gpt-4', 'gpt-3.5-turbo']
    };

    expect(provider.requiresApiKey).toBe(true);
    expect(provider.models).toContain('gpt-4');
  });
});