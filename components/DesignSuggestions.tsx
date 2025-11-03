import React, { useState } from 'react';
import { AppProvider } from '../state/AppContext';
import { LightBulbIcon, ChevronDownIcon, WandSparklesIcon } from './icons';

export interface Suggestion {
  title: string;
  description: string;
}

export const DesignSuggestions: React.FC = () => {
    const { state, dispatch } = React.useContext(AppProvider);
    const {
        status,
        designSuggestions,
        analysisError,
        originalImageData,
        ui: { areInitialSuggestionsVisible }
    } = state;
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!originalImageData || !areInitialSuggestionsVisible) return null;

    const isLoading = status === 'analyzing';
    const isActionDisabled = ['generating', 'refining', 'creative_editing', 'cleaning'].includes(status);

    if (isLoading) return null; // Loading is handled by RoomAnalysis
    if (analysisError) return null;
    if (designSuggestions.length === 0) return null;

    const handleApply = (prompt: string) => {
        dispatch({ type: 'SET_PROMPT', payload: prompt });
    };

    const handleClean = (level: 'tidy' | 'empty') => {
        dispatch({ type: 'CLEAN_START', payload: level });
    }

    return (
        <div className="border-t border-slate-700 pt-6">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={!isCollapsed}
            >
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <LightBulbIcon className="w-5 h-5 text-amber-400" />
                    AI Quick Start
                </h3>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 mt-0' : 'max-h-screen mt-4'}`}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleClean('tidy')}
                        disabled={isActionDisabled}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500"
                        aria-label="Tidy up the room"
                    >
                        <WandSparklesIcon className="w-4 h-4" />
                        Tidy Up
                    </button>
                    <button
                        onClick={() => handleClean('empty')}
                        disabled={isActionDisabled}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500"
                        aria-label="Empty the room"
                    >
                        <WandSparklesIcon className="w-4 h-4" />
                        Empty Room
                    </button>
                </div>
                <div className="space-y-3 mt-4">
                    {designSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-indigo-400">{suggestion.title}</h4>
                        <p className="text-sm text-slate-300 mt-1 mb-3">{suggestion.description}</p>
                        <button
                        onClick={() => handleApply(suggestion.description)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
                        aria-label={`Apply suggestion: ${suggestion.title}`}
                        >
                        Apply Suggestion
                        </button>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
