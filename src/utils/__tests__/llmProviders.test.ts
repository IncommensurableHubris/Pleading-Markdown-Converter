import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService, LLM_PROVIDERS } from '../llmProviders';

describe('LLM_PROVIDERS', () => {
  it('should contain all expected providers', () => {
    const providerIds = LLM_PROVIDERS.map(p => p.id);
    expect(providerIds).toContain('local');
    expect(providerIds).toContain('openai');
    expect(providerIds).toContain('anthropic');
    expect(providerIds).toContain('groq');
  });

  it('should have correct API key requirements', () => {
    const localProvider = LLM_PROVIDERS.find(p => p.id === 'local');
    const openaiProvider = LLM_PROVIDERS.find(p => p.id === 'openai');
    
    expect(localProvider?.requiresApiKey).toBe(false);
    expect(openaiProvider?.requiresApiKey).toBe(true);
  });
});

describe('LLMService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('convertToMarkdown', () => {
    it('should handle successful OpenAI conversion', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '# Converted Markdown' } }],
          usage: { total_tokens: 150 }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: false,
        selectedExamples: [],
        customPrompt: ''
      };

      const result = await LLMService.convertToMarkdown('test text', settings, []);

      expect(result.success).toBe(true);
      expect(result.markdown).toBe('# Converted Markdown');
      expect(result.tokensUsed).toBe(150);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'API key invalid' }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'invalid-key',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: false,
        selectedExamples: [],
        customPrompt: ''
      };

      const result = await LLMService.convertToMarkdown('test text', settings, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key invalid');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: false,
        selectedExamples: [],
        customPrompt: ''
      };

      const result = await LLMService.convertToMarkdown('test text', settings, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should include examples in prompt when provided', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '# Converted' } }],
          usage: { total_tokens: 100 }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: true,
        selectedExamples: ['1'],
        customPrompt: ''
      };

      const examples = [{
        id: '1',
        name: 'Test Example',
        originalText: 'Original legal text',
        convertedMarkdown: '# Legal Document',
        pleadingType: 'Statement of Claim'
      }];

      await LLMService.convertToMarkdown('test text', settings, examples);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          }),
          body: expect.stringContaining('Example 1')
        })
      );
    });

    it('should use custom prompt when provided', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '# Custom' } }],
          usage: { total_tokens: 100 }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: false,
        selectedExamples: [],
        customPrompt: 'Custom conversion instructions'
      };

      await LLMService.convertToMarkdown('test text', settings, []);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.messages[0].content).toContain('Custom conversion instructions');
    });
  });

  describe('processText', () => {
    it('should handle successful text processing', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Cleaned text' } }],
          usage: { total_tokens: 50 }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.1,
        maxTokens: 4000
      };

      const result = await LLMService.processText('Clean this text', settings);

      expect(result.success).toBe(true);
      expect(result.content).toBe('Cleaned text');
      expect(result.tokensUsed).toBe(50);
    });
  });

  describe('Local LLM support', () => {
    it('should handle local LLM calls', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Local response' } }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const settings = {
        provider: 'local',
        model: 'custom',
        apiKey: '',
        temperature: 0.1,
        maxTokens: 4000,
        useExamples: false,
        selectedExamples: [],
        customPrompt: '',
        customBaseUrl: 'http://localhost:11434/v1',
        customModel: 'llama2'
      };

      const result = await LLMService.convertToMarkdown('test text', settings, []);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"model":"llama2"')
        })
      );
    });
  });
});