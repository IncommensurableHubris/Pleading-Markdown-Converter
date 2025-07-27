import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionPreview } from '../ConversionPreview';
import { DocumentInfo, ConversionResult } from '../../types';

describe('ConversionPreview', () => {
  const mockDocInfo: DocumentInfo = {
    filename: 'test-document.pdf',
    size: 1024,
    type: 'application/pdf',
    extractedText: 'This is the extracted text from the legal document.\nIt contains multiple lines and legal content.'
  };

  const mockConversionResult: ConversionResult = {
    success: true,
    markdown: '# Legal Document\n\nThis is the **converted** markdown content.',
    tokensUsed: 150,
    processingTime: 2500
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true
    });
  });

  it('should show upload prompt when no document is provided', () => {
    render(
      <ConversionPreview 
        docInfo={null}
        conversionResult={null}
        isConverting={false}
      />
    );

    expect(screen.getByText('Upload a document to see the preview')).toBeInTheDocument();
  });

  it('should display document information', () => {
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={null}
        isConverting={false}
      />
    );

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB • 94 characters')).toBeInTheDocument();
  });

  it('should show original text by default', () => {
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={null}
        isConverting={false}
      />
    );

    expect(screen.getByText(/This is the extracted text/)).toBeInTheDocument();
    expect(screen.getByText('2 lines')).toBeInTheDocument();
  });

  it('should show converting state', () => {
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={null}
        isConverting={true}
      />
    );

    expect(screen.getByText('Converting to markdown...')).toBeInTheDocument();
  });

  it('should display successful conversion result', () => {
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={mockConversionResult}
        isConverting={false}
      />
    );

    // Switch to markdown tab
    fireEvent.click(screen.getByText('Converted Markdown'));

    expect(screen.getByText('Download Markdown File')).toBeInTheDocument();
    expect(screen.getByText('2500ms')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display conversion error', () => {
    const errorResult: ConversionResult = {
      success: false,
      error: 'API key invalid',
      processingTime: 1000
    };

    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={errorResult}
        isConverting={false}
      />
    );

    // Switch to markdown tab
    fireEvent.click(screen.getByText('Converted Markdown'));

    expect(screen.getByText('Conversion failed')).toBeInTheDocument();
    expect(screen.getByText('API key invalid')).toBeInTheDocument();
  });

  it('should copy markdown to clipboard', async () => {
    const user = userEvent.setup();
    
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={mockConversionResult}
        isConverting={false}
      />
    );

    const copyButton = screen.getByTitle('Copy markdown to clipboard');
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockConversionResult.markdown);
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should download original text file', async () => {
    const user = userEvent.setup();
    
    // Mock document.createElement
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={mockConversionResult}
        isConverting={false}
      />
    );

    const downloadButton = screen.getByTitle('Download original extracted text');
    await user.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('test-document_original.txt');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should download markdown file with metadata', async () => {
    const user = userEvent.setup();
    
    // Mock document.createElement
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={mockConversionResult}
        isConverting={false}
      />
    );

    // Switch to markdown tab
    fireEvent.click(screen.getByText('Converted Markdown'));

    const downloadButton = screen.getByText('Download Markdown File');
    await user.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.download).toContain('test-document_converted_');
    expect(mockLink.download).toContain('.md');
    expect(mockLink.click).toHaveBeenCalled();
    
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should toggle between raw and preview markdown', async () => {
    const user = userEvent.setup();
    
    render(
      <ConversionPreview 
        docInfo={mockDocInfo}
        conversionResult={mockConversionResult}
        isConverting={false}
      />
    );

    // Switch to markdown tab
    fireEvent.click(screen.getByText('Converted Markdown'));

    // Click raw toggle
    const rawButton = screen.getByText('Raw');
    await user.click(rawButton);

    // Should show raw markdown
    expect(screen.getByText('# Legal Document')).toBeInTheDocument();
    
    // Toggle back to preview
    const previewButton = screen.getByText('Preview');
    await user.click(previewButton);

    // Should show rendered content
    expect(screen.getByText('Legal Document')).toBeInTheDocument();
  });
});