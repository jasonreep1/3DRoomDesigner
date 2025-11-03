import React from 'react';
import { LightBulbIcon, ExclamationTriangleIcon, XMarkIcon } from './icons';
import { Suggestion } from './DesignSuggestions';

interface RefinementSuggestionsProps {
  isLoading: boolean;
  suggestions: Suggestion[];
  error: string | null;
  onApply: (prompt: string) => void;
  onDismiss: () => void;
}

export const RefinementSuggestions: React.FC<RefinementSuggestionsProps> = ({ isLoading, suggestions, error, onApply, onDismiss }) => {
  if (isLoading) {
    return (
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
          Getting refinement ideas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-2">
        <div role="alert" className="flex items-center gap-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm"><strong>Suggestion Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold text-slate-200 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-amber-400" />
          Refinement Ideas
        </h4>
        <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Dismiss suggestions">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-slate-800/70 p-3 rounded-lg border border-slate-600">
            <h5 className="font-semibold text-indigo-400 text-sm">{suggestion.title}</h5>
            <p className="text-sm text-slate-300 mt-1 mb-3">{suggestion.description}</p>
            <button
              onClick={() => onApply(suggestion.description)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
              aria-label={`Apply suggestion: ${suggestion.title}`}
            >
              Apply Suggestion
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
