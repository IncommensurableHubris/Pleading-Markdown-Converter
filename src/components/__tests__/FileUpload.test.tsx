import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';
import { ConversionSettings } from '../../types';

// Mock FileProcessor
vi.mock('../../utils/fileProcessing', () => ({
  FileProcessor: {
    extractText: vi.fn(() => Promise.resolve('extracted text content'))
  }
}));

describe('FileUpload', () => {
  const mockOnFileProcessed = vi.fn();
  const defaultSettings: ConversionSettings = {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload area', () => {
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    expect(screen.getByText('Upload legal pleading')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop or click to select/)).toBeInTheDocument();
  });

  it('should show processing state', () => {
    const { rerender } = render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    // Upload a file to trigger processing
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    // During processing, should show processing state
    expect(screen.getByText('Processing file...')).toBeInTheDocument();
  });

  it('should accept valid file types', async () => {
    const { FileProcessor } = await import('../../utils/fileProcessing');
    
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    const user = userEvent.setup();

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(FileProcessor.extractText).toHaveBeenCalledWith(file, defaultSettings);
      expect(mockOnFileProcessed).toHaveBeenCalledWith({
        filename: 'test.txt',
        size: file.size,
        type: 'text/plain',
        extractedText: 'extracted text content'
      });
    });
  });

  it('should reject invalid file types', async () => {
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    const file = new File(['content'], 'test.xyz', { type: 'application/unknown' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Please upload a TXT, DOCX, or PDF file')).toBeInTheDocument();
    });
    expect(mockOnFileProcessed).not.toHaveBeenCalled();
  });

  it('should reject files that are too large', async () => {
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    const largeContent = 'x'.repeat(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('File size must be less than 10 MB')).toBeInTheDocument();
    expect(mockOnFileProcessed).not.toHaveBeenCalled();
  });

  it('should require LLM configuration for PDF files', async () => {
    const unconfiguredSettings = {
      ...defaultSettings,
      provider: 'openai',
      apiKey: ''
    };
    
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={unconfiguredSettings}
      />
    );

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/PDF processing requires LLM configuration/)).toBeInTheDocument();
    expect(mockOnFileProcessed).not.toHaveBeenCalled();
  });

  it('should handle file processing errors', async () => {
    const { FileProcessor } = await import('../../utils/fileProcessing');
    
    (FileProcessor.extractText as any).mockRejectedValue(new Error('Processing failed'));
    
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Processing failed')).toBeInTheDocument();
    });
  });

  it('should support drag and drop', async () => {
    const { FileProcessor } = await import('../../utils/fileProcessing');
    
    render(
      <FileUpload 
        onFileProcessed={mockOnFileProcessed}
        settings={defaultSettings}
      />
    );

    const uploadArea = screen.getByText('Upload legal pleading').closest('div')?.parentElement!;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.dragEnter(uploadArea);
    fireEvent.dragOver(uploadArea);
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      expect(FileProcessor.extractText).toHaveBeenCalledWith(file, defaultSettings);
    });
  });
});