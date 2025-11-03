import React, { useState } from 'react';
import { AppProvider } from '../state/AppContext';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from './icons';

export const ResultDisplay: React.FC = () => {
  const { state, dispatch } = React.useContext(AppProvider);
  const [refinementInput, setRefinementInput] = useState('');

  const handleRefinementSubmit = () => {
    if (refinementInput.trim()) {
      dispatch({ type: 'REQUEST_REFINEMENT_START', payload: refinementInput });
      setRefinementInput('');
    }
  };

  const handleConfirmRefinement = () => {
    dispatch({ type: 'CONFIRM_REFINEMENT_START' });
  };

  const handleCancelRefinement = () => {
    dispatch({ type: 'CANCEL_REFINEMENT' });
  };

  const handleClarifyRefinement = () => {
    dispatch({ type: 'CLARIFY_REFINEMENT' });
  };

  const handleTryAgain = () => {
    dispatch({ type: 'TRY_AGAIN_START' });
  };

  if (!state.activeItem) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      {/* Result Image */}
      <div className="mb-6">
        <img
          src={state.activeItem.imageUrl}
          alt="Generated design"
          className="w-full rounded-lg shadow-lg"
        />
      </div>

      {/* Status Messages */}
      {state.status === 'error' && state.errorMessage && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-200">{state.errorMessage}</p>
            <button
              onClick={handleTryAgain}
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Refinement Confirmation */}
      {state.status === 'awaiting_confirmation' && state.refinementConfirmationMessage && (
        <div className="mb-4 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg">
          <p className="text-indigo-200 mb-4">{state.refinementConfirmationMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={handleConfirmRefinement}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Confirm
            </button>
            <button
              onClick={handleClarifyRefinement}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Clarify
            </button>
            <button
              onClick={handleCancelRefinement}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Refinement Clarification */}
      {state.refinementClarificationMessage && (
        <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-200">{state.refinementClarificationMessage}</p>
        </div>
      )}

      {/* Loading States */}
      {(state.status === 'confirming_refinement' || state.status === 'refining') && (
        <div className="mb-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center gap-3">
          <ArrowPathIcon className="w-5 h-5 text-indigo-400 animate-spin" />
          <p className="text-slate-300">
            {state.status === 'confirming_refinement' ? 'Processing refinement request...' : 'Generating refined design...'}
          </p>
        </div>
      )}

      {/* Refinement Input */}
      {state.status === 'idle' && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Refine this design
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRefinementSubmit()}
              placeholder="E.g., 'Make the walls lighter' or 'Add more plants'"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRefinementSubmit}
              disabled={!refinementInput.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              Refine
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
