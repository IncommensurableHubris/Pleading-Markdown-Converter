import React, { useState } from 'react';
import { Plus, Trash2, Edit, Check, X, BookOpen } from 'lucide-react';
import { ConversionExample } from '../types';

interface ExamplesManagerProps {
  examples: ConversionExample[];
  selectedExamples: string[];
  onExamplesChange: (examples: ConversionExample[]) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  useExamples: boolean;
  onUseExamplesChange: (use: boolean) => void;
}

export const ExamplesManager: React.FC<ExamplesManagerProps> = ({
  examples,
  selectedExamples,
  onExamplesChange,
  onSelectionChange,
  useExamples,
  onUseExamplesChange
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExample, setNewExample] = useState<Partial<ConversionExample>>({
    name: '',
    originalText: '',
    convertedMarkdown: '',
    pleadingType: ''
  });

  const handleAddExample = () => {
    if (!newExample.name || !newExample.originalText || !newExample.convertedMarkdown) {
      return;
    }

    const example: ConversionExample = {
      id: Date.now().toString(),
      name: newExample.name,
      originalText: newExample.originalText,
      convertedMarkdown: newExample.convertedMarkdown,
      pleadingType: newExample.pleadingType || 'General'
    };

    onExamplesChange([...examples, example]);
    setNewExample({ name: '', originalText: '', convertedMarkdown: '', pleadingType: '' });
    setIsAdding(false);
  };

  const handleDeleteExample = (id: string) => {
    onExamplesChange(examples.filter(ex => ex.id !== id));
    onSelectionChange(selectedExamples.filter(exId => exId !== id));
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedExamples, id]);
    } else {
      onSelectionChange(selectedExamples.filter(exId => exId !== id));
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Few-Shot Examples</h3>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={useExamples}
                onChange={(e) => onUseExamplesChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Use examples</span>
            </label>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Example</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {examples.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No examples added yet</p>
            <p className="text-xs mt-1">Add examples to improve conversion quality</p>
          </div>
        )}

        {/* Add new example form */}
        {isAdding && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Example name"
                  value={newExample.name}
                  onChange={(e) => setNewExample({ ...newExample, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Pleading type (e.g., Statement of Claim)"
                  value={newExample.pleadingType}
                  onChange={(e) => setNewExample({ ...newExample, pleadingType: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Original Text</label>
                  <textarea
                    placeholder="Enter original legal text..."
                    value={newExample.originalText}
                    onChange={(e) => setNewExample({ ...newExample, originalText: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Converted Markdown</label>
                  <textarea
                    placeholder="Enter the desired markdown output..."
                    value={newExample.convertedMarkdown}
                    onChange={(e) => setNewExample({ ...newExample, convertedMarkdown: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleAddExample}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Example list */}
        {examples.map((example) => (
          <div key={example.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedExamples.includes(example.id)}
                  onChange={(e) => handleSelectionChange(example.id, e.target.checked)}
                  disabled={!useExamples}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{example.name}</h4>
                  <p className="text-sm text-gray-500">{example.pleadingType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingId(example.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteExample(example.id)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Original Text</p>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                  {example.originalText}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Converted Markdown</p>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                  {example.convertedMarkdown}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};