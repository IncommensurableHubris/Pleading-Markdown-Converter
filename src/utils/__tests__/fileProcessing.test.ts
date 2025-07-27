import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileProcessor } from '../fileProcessing';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => Promise.resolve({
        getTextContent: vi.fn(() => Promise.resolve({
          items: [
            { str: 'mock' },
            { str: 'pdf' },
            { str: 'content' }
          ]
        }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(() => Promise.resolve({ value: 'mocked docx content' }))
  }
}));

describe('FileProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(FileProcessor.formatFileSize(0)).toBe('0 Bytes');
      expect(FileProcessor.formatFileSize(1024)).toBe('1 KB');
      expect(FileProcessor.formatFileSize(1048576)).toBe('1 MB');
      expect(FileProcessor.formatFileSize(1073741824)).toBe('1 GB');
      expect(FileProcessor.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('extractText', () => {
    it('should extract text from txt files', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const result = await FileProcessor.extractText(file);
      expect(result).toBe('mock text content');
    });

    it('should extract text from docx files', async () => {
      const file = new File(['docx content'], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const result = await FileProcessor.extractText(file);
      expect(result).toBe('mocked docx content');
    });

    it('should handle unsupported file types', async () => {
      const file = new File(['content'], 'test.xyz', { type: 'application/unknown' });
      
      await expect(FileProcessor.extractText(file)).rejects.toThrow(
        'Unsupported file type: application/unknown'
      );
    });

    it('should extract and clean PDF text with LLM when settings provided', async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const mockSettings = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 4000
      };

      // Mock the LLM cleaning
      const mockLLMService = await import('../llmProviders');
      vi.spyOn(mockLLMService.LLMService, 'processText').mockResolvedValue({
        success: true,
        content: 'cleaned pdf content',
        processingTime: 1000
      });

      const result = await FileProcessor.extractText(file, mockSettings);
      expect(result).toBe('cleaned pdf content');
      expect(mockLLMService.LLMService.processText).toHaveBeenCalled();
    });

    it('should fallback to raw text if LLM cleaning fails', async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const mockSettings = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 4000
      };

      // Mock the LLM cleaning to fail
      const mockLLMService = await import('../llmProviders');
      vi.spyOn(mockLLMService.LLMService, 'processText').mockResolvedValue({
        success: false,
        error: 'LLM error',
        processingTime: 1000
      });

      // Mock console.warn to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await FileProcessor.extractText(file, mockSettings);
      expect(result).toBeTruthy(); // Should return raw extracted text
      expect(consoleSpy).toHaveBeenCalledWith('LLM text cleaning failed, using raw extracted text');
      
      consoleSpy.mockRestore();
    });
  });
});