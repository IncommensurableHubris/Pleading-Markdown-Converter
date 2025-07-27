import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Increase test timeout for complex operations
vi.setConfig({ testTimeout: 15000 });

// Mock PDF.js worker
Object.defineProperty(window, 'Worker', {
  value: class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock FileReader
class MockFileReader {
  result: any = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  readAsText(file: any) {
    setTimeout(() => {
      this.result = 'mock text content';
      this.onload?.({ target: { result: this.result } });
    }, 0);
  }
  
  readAsArrayBuffer(file: any) {
    setTimeout(() => {
      this.result = new ArrayBuffer(10);
      this.onload?.({ target: { result: this.result } });
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: MockFileReader
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true
});

// Mock window.URL methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true
});

// Mock console methods to reduce noise
Object.defineProperty(console, 'warn', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(console, 'error', {
  value: vi.fn(),
  writable: true
});

// Provide a more complete navigator mock
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  },
  writable: true
});

// Mock fetch globally