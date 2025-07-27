import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { LLMService } from './llmProviders';
import { ConversionSettings } from '../types';

// Set up PDF.js worker for browser environment
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
}

interface ExtractTextOptions {
  maxFileSize?: number;
  supportedTypes?: string[];
  supportedExtensions?: string[];
}

const DEFAULT_OPTIONS: ExtractTextOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedTypes: [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ],
  supportedExtensions: ['.txt', '.docx', '.pdf']
};
export class FileProcessor {
  static async extractText(file: File, settings?: ConversionSettings): Promise<string> {
    this.validateFile(file);
    
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      let rawText: string;
      
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        rawText = await this.extractTextFromTxt(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        rawText = await this.extractTextFromDocx(file);
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        if (!settings) {
          throw new Error('PDF processing requires LLM settings for text cleaning');
        }
        rawText = await this.extractTextFromPdf(file);
        // Clean PDF text with LLM
        return await this.cleanTextWithLLM(rawText, settings);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      return rawText;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract text: ${message}`);
    }
  }

  private static validateFile(file: File, options: ExtractTextOptions = DEFAULT_OPTIONS): void {
    const { maxFileSize, supportedTypes, supportedExtensions } = options;
    
    // Check file size
    if (maxFileSize && file.size > maxFileSize) {
      throw new Error(`File size must be less than ${this.formatFileSize(maxFileSize)}`);
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = supportedTypes?.includes(file.type);
    const isValidExtension = supportedExtensions?.includes(fileExtension);
    
    if (!isValidType && !isValidExtension) {
      throw new Error('Please upload a TXT, DOCX, or PDF file');
    }
  }

  private static async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private static async extractTextFromDocx(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(new Error('Failed to extract text from DOCX file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async extractTextFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          if (!arrayBuffer) {
            throw new Error('Failed to read file content');
          }

          const loadingTask = getDocument({ data: arrayBuffer });
          const pdfDocument = await loadingTask.promise;
          
          let fullText = '';
          
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
              .filter((item: any) => item.str && typeof item.str === 'string')
              .map((item: any) => item.str.trim())
              .filter(str => str.length > 0)
              .join(' ');
              
            if (pageText) {
              fullText += pageText + '\n\n';
            }
          }
          
          const trimmedText = fullText.trim();
          if (!trimmedText) {
            throw new Error('No readable text found in PDF. The PDF may not contain selectable text or may be image-based. Please ensure the PDF is OCRed and contains selectable text.');
          }
          
          resolve(trimmedText);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          reject(new Error(`Failed to extract text from PDF: ${message}. Please ensure the PDF contains selectable text.`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async cleanTextWithLLM(rawText: string, settings: ConversionSettings): Promise<string> {
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text content to clean');
    }

    const cleaningPrompt = `You are a document processing expert. Clean the following extracted PDF text by:

1. Remove headers, footers, page numbers, and watermarks
2. Remove repetitive formatting artifacts and OCR noise
3. Fix broken words and sentences caused by PDF extraction
4. Maintain the logical structure and flow of the legal document
5. Preserve important legal content, case citations, and references
6. Remove unnecessary whitespace and formatting characters
7. Ensure paragraphs flow naturally
8. Keep numbered sections and legal formatting intact
9. Remove any gibberish or corrupted text fragments
10. Ensure the text is coherent and readable

IMPORTANT: Only return the cleaned text content. Do not add any explanations, comments, or markdown formatting.

Raw extracted text:
${rawText}

Cleaned text:`;

    try {
      const result = await LLMService.processText(cleaningPrompt, settings);
      if (result.success && result.content?.trim()) {
        return result.content.trim();
      } else {
        console.warn('LLM text cleaning failed, using raw extracted text');
        return rawText;
      }
    } catch (error) {
      console.warn('LLM text cleaning error, using raw extracted text:', error);
      return rawText;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 0) return 'Invalid size';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}