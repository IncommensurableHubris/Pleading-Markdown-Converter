import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExamplesManager } from '../ExamplesManager';
import { ConversionExample } from '../../types';

describe('ExamplesManager', () => {
  const mockExamples: ConversionExample[] = [
    {
      id: '1',
      name: 'Test Example 1',
      originalText: 'Original legal text 1',
      convertedMarkdown: '# Legal Document 1',
      pleadingType: 'Statement of Claim'
    },
    {
      id: '2',
      name: 'Test Example 2',
      originalText: 'Original legal text 2',
      convertedMarkdown: '# Legal Document 2',
      pleadingType: 'Defence'
    }
  ];

  const mockOnExamplesChange = vi.fn();
  const mockOnSelectionChange = vi.fn();
  const mockOnUseExamplesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no examples exist', () => {
    render(
      <ExamplesManager
        examples={[]}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={false}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    expect(screen.getByText('No examples added yet')).toBeInTheDocument();
    expect(screen.getByText('Add examples to improve conversion quality')).toBeInTheDocument();
  });

  it('should display existing examples', () => {
    render(
      <ExamplesManager
        examples={mockExamples}
        selectedExamples={['1']}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={true}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    expect(screen.getByText('Test Example 1')).toBeInTheDocument();
    expect(screen.getByText('Test Example 2')).toBeInTheDocument();
    expect(screen.getByText('Statement of Claim')).toBeInTheDocument();
    expect(screen.getByText('Defence')).toBeInTheDocument();
  });

  it('should toggle use examples checkbox', async () => {
    const user = userEvent.setup();
    
    render(
      <ExamplesManager
        examples={mockExamples}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={false}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    const checkbox = screen.getByLabelText('Use examples');
    await user.click(checkbox);

    expect(mockOnUseExamplesChange).toHaveBeenCalledWith(true);
  });

  it('should select and deselect examples', async () => {
    const user = userEvent.setup();
    
    render(
      <ExamplesManager
        examples={mockExamples}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={true}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const exampleCheckbox = checkboxes.find(cb => cb !== screen.getByLabelText('Use examples'));
    
    if (exampleCheckbox) {
      await user.click(exampleCheckbox);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    }
  });

  it('should open add example form', async () => {
    const user = userEvent.setup();
    
    render(
      <ExamplesManager
        examples={[]}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={false}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    const addButton = screen.getByText('Add Example');
    await user.click(addButton);

    expect(screen.getByPlaceholderText('Example name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter original legal text...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter the desired markdown output...')).toBeInTheDocument();
  });

  it('should add new example', async () => {
    const user = userEvent.setup();
    
    render(
      <ExamplesManager
        examples={[]}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={false}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    // Open add form
    await user.click(screen.getByText('Add Example'));

    // Fill in the form
    await user.type(screen.getByPlaceholderText('Example name'), 'New Example');
    await user.type(screen.getByPlaceholderText('Pleading type (e.g., Statement of Claim)'), 'Statement of Claim');
    await user.type(screen.getByPlaceholderText('Enter original legal text...'), 'Original text');
    await user.type(screen.getByPlaceholderText('Enter the desired markdown output...'), '# Markdown');

    // Submit the form
    const buttons = screen.getAllByRole('button');
    const checkButton = buttons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'check'
    );
    
    expect(checkButton).toBeDefined();
    await user.click(checkButton);

    expect(mockOnExamplesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'New Example',
        originalText: 'Original text',
        convertedMarkdown: '# Markdown',
        pleadingType: 'Statement of Claim'
      })
    ]);
  });

  it('should delete example', async () => {
    const user = userEvent.setup();
    
    render(
      <ExamplesManager
        examples={mockExamples}
        selectedExamples={['1']}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={true}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      
      expect(mockOnExamplesChange).toHaveBeenCalledWith([mockExamples[1]]);
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    }
  });

  it('should disable example checkboxes when use examples is false', () => {
    render(
      <ExamplesManager
        examples={mockExamples}
        selectedExamples={[]}
        onExamplesChange={mockOnExamplesChange}
        onSelectionChange={mockOnSelectionChange}
        useExamples={false}
        onUseExamplesChange={mockOnUseExamplesChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const exampleCheckboxes = checkboxes.filter(cb => cb !== screen.getByLabelText('Use examples'));
    
    exampleCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });
});