import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the LLM service
vi.mock('../utils/llmProviders', () => ({
  LLM_PROVIDERS: [
    {
      id: 'local',
      name: 'Local/Custom API',
      baseUrl: 'http://localhost:11434/v1',
      requiresApiKey: false,
      models: ['custom']
    },
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      requiresApiKey: true,
      models: ['gpt-4', 'gpt-3.5-turbo']
    }
  ],
  LLMService: {
    convertToMarkdown: vi.fn(() => Promise.resolve({
      success: true,
      markdown: '# Converted Legal Document\n\nThis is the converted content.',
      tokensUsed: 150,
      processingTime: 2000
    })),
    processText: vi.fn(() => Promise.resolve({
      success: true,
      content: 'cleaned text content',
      processingTime: 1000
    }))
  }
}));

// Mock file processing
vi.mock('../utils/fileProcessing', () => ({
  FileProcessor: {
    extractText: vi.fn(() => Promise.resolve('extracted legal document text')),
    formatFileSize: vi.fn((bytes) => `${Math.round(bytes / 1024)} KB`)
  }
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should complete full workflow: upload → settings → convert → download', async () => {
    const user = userEvent.setup();
    const { LLMService } = await import('../utils/llmProviders');
    const { FileProcessor } = await import('../utils/fileProcessing');
    
    render(<App />);

    // Verify initial state
    expect(screen.getByText('Legal Pleading Converter')).toBeInTheDocument();
    expect(screen.getByText('Setup Required')).toBeInTheDocument();

    // 1. Configure settings
    await user.click(screen.getByText('Settings'));
    
    expect(screen.getByText('LLM Provider Configuration')).toBeInTheDocument();
    
    // Select OpenAI provider
    await user.click(screen.getByText('OpenAI'));
    
    // Add API key
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    await user.type(apiKeyInput, 'test-api-key');
    
    // Go back to main page
    await user.click(screen.getByText('Back to Converter'));

    // Verify configuration is now complete
    expect(screen.getByText('Ready')).toBeInTheDocument();

    // 2. Upload a file
    const file = new File(['legal content'], 'legal-doc.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload legal pleading').closest('div');
    const uploadInput = uploadArea?.querySelector('input[type="file"]');
    
    expect(uploadInput).toBeTruthy();
    await user.upload(uploadInput, file);

    await waitFor(() => {
      expect(FileProcessor.extractText).toHaveBeenCalledWith(file, expect.any(Object));
      expect(screen.getByText('legal-doc.txt')).toBeInTheDocument();
    });

    // 3. Convert to markdown
    const convertButton = screen.getByText('Convert to Markdown');
    expect(convertButton).not.toBeDisabled();
    
    await user.click(convertButton);

    await waitFor(() => {
      expect(LLMService.convertToMarkdown).toHaveBeenCalledWith(
        'extracted legal document text',
        expect.objectContaining({
          provider: 'openai',
          apiKey: 'test-api-key'
        }),
        []
      );
    });

    // 4. Verify conversion result
    await waitFor(() => {
      expect(screen.getByText('2000ms')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Switch to markdown tab
    fireEvent.click(screen.getByText('Converted Markdown'));
    
    // 5. Download markdown file
    const downloadButton = screen.getByText('Download Markdown File');
    await user.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText('Downloaded Successfully!')).toBeInTheDocument();
    });
  });

  it('should persist settings in localStorage', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Go to settings
    await user.click(screen.getByText('Settings'));
    
    // Change provider to OpenAI
    await user.click(screen.getByText('OpenAI'));
    
    // Add API key
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    await user.type(apiKeyInput, 'persistent-key');
    
    // Go back
    await user.click(screen.getByText('Back to Converter'));

    // Verify localStorage was updated
    const savedSettings = JSON.parse(localStorage.getItem('legalConverterSettings') || '{}');
    expect(savedSettings.provider).toBe('openai');
    expect(savedSettings.apiKey).toBe('persistent-key');
  });

  it('should handle conversion errors gracefully', async () => {
    const user = userEvent.setup();
    const { LLMService } = await import('../utils/llmProviders');
    const { FileProcessor } = await import('../utils/fileProcessing');
    
    // Mock conversion failure
    (LLMService.convertToMarkdown as any).mockResolvedValue({
      success: false,
      error: 'API rate limit exceeded',
      processingTime: 1000
    });
    
    render(<App />);

    // Configure settings
    await user.click(screen.getByText('Settings'));
    await user.click(screen.getByText('OpenAI'));
    await user.type(screen.getByPlaceholderText('Enter your API key'), 'test-key');
    await user.click(screen.getByText('Back to Converter'));

    // Upload file
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await user.upload(screen.getByRole('button'), file);

    await waitFor(() => {
      expect(FileProcessor.extractText).toHaveBeenCalled();
    });

    // Attempt conversion
    await user.click(screen.getByText('Convert to Markdown'));

    // Check error is displayed
    fireEvent.click(screen.getByText('Converted Markdown'));
    
    await waitFor(() => {
      expect(screen.getByText('Conversion failed')).toBeInTheDocument();
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('should redirect to settings when trying to convert without configuration', async () => {
    const user = userEvent.setup();
    const { FileProcessor } = await import('../utils/fileProcessing');
    
    render(<App />);

    // Upload file without configuring settings
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload legal pleading').closest('div');
    const uploadInput = uploadArea?.querySelector('input[type="file"]');
    
    expect(uploadInput).toBeTruthy();
    await user.upload(uploadInput, file);

    await waitFor(() => {
      expect(FileProcessor.extractText).toHaveBeenCalled();
    });

    // Try to convert (should redirect to settings)
    await user.click(screen.getByText('Convert to Markdown'));

    // Should be redirected to settings page
    expect(screen.getByText('LLM Provider Configuration')).toBeInTheDocument();
  });

  it('should handle local LLM configuration', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Go to settings
    await user.click(screen.getByText('Settings'));
    
    // Local provider should be selected by default
    expect(screen.getByText('Local LLM Setup Guide')).toBeInTheDocument();
    
    // Configure custom model
    const modelInput = screen.getByDisplayValue('llama2');
    await user.clear(modelInput);
    await user.type(modelInput, 'codellama');
    
    // Configure custom base URL
    const baseUrlInput = screen.getByDisplayValue('http://localhost:11434/v1');
    await user.clear(baseUrlInput);
    await user.type(baseUrlInput, 'http://localhost:1234/v1');
    
    // Go back
    await user.click(screen.getByText('Back to Converter'));

    // Should show as configured (local doesn't require API key)
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('codellama')).toBeInTheDocument();
  });

  it('should manage examples correctly', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Initially no examples
    expect(screen.getByText('No examples added yet')).toBeInTheDocument();

    // Add an example
    await user.click(screen.getByText('Add Example'));
    
    await user.type(screen.getByPlaceholderText('Example name'), 'Test Example');
    await user.type(screen.getByPlaceholderText('Pleading type (e.g., Statement of Claim)'), 'Statement of Claim');
    await user.type(screen.getByPlaceholderText('Enter original legal text...'), 'Original legal text');
    await user.type(screen.getByPlaceholderText('Enter the desired markdown output...'), '# Legal Document');

    // Submit the form
    const submitButtons = screen.getAllByRole('button');
    const checkButton = submitButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'check'
    );
    
    if (checkButton) {
      await user.click(checkButton);
    }

    // Verify example was added
    expect(screen.getByText('Test Example')).toBeInTheDocument();
    
    // Enable use examples
    await user.click(screen.getByLabelText('Use examples'));
    
    // Select the example
    const exampleCheckboxes = screen.getAllByRole('checkbox');
    const exampleCheckbox = exampleCheckboxes.find(cb => cb !== screen.getByLabelText('Use examples'));
    if (exampleCheckbox) {
      await user.click(exampleCheckbox);
    }

    // Verify examples are persisted in localStorage
    const savedExamples = JSON.parse(localStorage.getItem('legalConverterExamples') || '[]');
    expect(savedExamples).toHaveLength(1);
    expect(savedExamples[0].name).toBe('Test Example');
  });
});