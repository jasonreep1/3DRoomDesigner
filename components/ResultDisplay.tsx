import React, { useState, useEffect } from 'react';
import { AppProvider } from '../state/AppContext';
import { RefinementSuggestions } from './RefinementSuggestions';
import { DesignLenses } from './DesignLenses';
import { SparklesIcon, CubeTransparentIcon, WandSparklesIcon, InformationCircleIcon, LightBulbIcon, PencilIcon, CheckIcon, XMarkIcon, ArrowPathIcon, ChatBubbleBottomCenterTextIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from './icons';

const loadingMessages = [
    "Rendering photorealistic lighting...",
    "Pro Tip: Use the 'Edit Area' tool for precise changes.",
    "Applying advanced design principles...",
    "Did you know you can save your whole project from the header?",
    "Polishing the final details...",
    "Analyzing room structure and perspective..."
];

export const ResultDisplay: React.FC = () => {
    const { state, dispatch } = React.useContext(AppProvider);
    const {
        status,
        activeItem,
        maskDataUrl,
        alterationPrompt,
        refinementSuggestions,
        refinementSuggestionError,
        refinementConfirmationMessage,
        refinementClarificationMessage,
        refinementRetryCount,
    } = state;

    const isLoading = ['generating', 'refining', 'creative_editing', 'cleaning', 'refining_critiquing'].includes(status);
    const isConfirming = status === 'confirming_refinement';
    const isAwaitingRefinementConfirmation = status === 'awaiting_confirmation';
    const isSuggestingRefinements = status === 'suggesting_refinements';

    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const activeItemIndex = state.activeItem ? state.history.findIndex(item => item.id === state.activeItem.id) : -1;
    const canTryAgain = state.history.length > 0 && state.activeItem;

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    const handleRequestRefinement = (promptOverride?: string) => {
        const prompt = promptOverride ?? alterationPrompt;
        if(activeItem && prompt) {
            dispatch({ type: 'REQUEST_REFINEMENT_START', payload: prompt });
        }
    };

    const canAlter = activeItem !== undefined && alterationPrompt.trim().length > 0 && !isLoading;
    const isMaskActive = !!maskDataUrl;

    const getLoadingSubtext = () => {
        if (status === 'refining_critiquing') return "Critiquing the result...";
        if (status === 'refining' && refinementRetryCount > 0) return "That wasn't quite right, trying again...";
        return loadingMessage;
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                    <p className="mt-4 text-lg font-semibold">Generating your design...</p>
                    <p className="text-sm text-slate-500 transition-opacity duration-500">{getLoadingSubtext()}</p>
                </div>
            );
        }

        if (activeItem) {
            const isFailure = activeItem.isFailure;
            return (
                <div className="w-full h-full flex flex-col">
                    <div className="w-full flex justify-between items-center mb-4 gap-2">
                        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-indigo-400"/>
                            Your Design
                        </h3>
                        <button
                            onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'maskingEditor' })}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-md transition-colors"
                            aria-label="Edit a specific area of the design"
                        >
                            <WandSparklesIcon className="w-4 h-4" />
                            Edit Area
                        </button>
                    </div>
                    <div className="relative w-full">
                        <button
                            onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'lightbox' })}
                            className="w-full h-auto cursor-pointer group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 rounded-lg"
                            aria-label="View larger image"
                        >
                            <img
                                src={activeItem.imageUrl}
                                alt="Generated room design"
                                className="w-full h-auto object-contain rounded-lg shadow-2xl shadow-black/50 group-hover:opacity-80 transition-opacity"
                            />
                        </button>
                        {maskDataUrl && (
                        <img
                            src={maskDataUrl}
                            alt="Editing mask"
                            className="absolute top-0 left-0 w-full h-full object-contain rounded-lg pointer-events-none opacity-50"
                        />
                        )}
                    </div>
                    {activeItem.changeDescription && (
                        <div className={`mt-4 p-3 rounded-lg border ${isFailure ? 'bg-amber-900/30 border-amber-700/50' : 'bg-slate-900/50 border-slate-700'}`}>
                            <p className="text-sm flex items-start gap-2">
                                {isFailure ? (
                                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                                ) : (
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
                                )}
                                <span className={isFailure ? 'text-amber-200' : 'text-slate-300'}>{activeItem.changeDescription}</span>
                            </p>
                        </div>
                     )}
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <CubeTransparentIcon className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-slate-400">Your generated design will appear here</h3>
                <p className="mt-1 max-w-xs text-center">Upload an image and describe your vision to get started.</p>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
            <div className="flex-grow flex items-center justify-center min-h-[400px] lg:min-h-0">
                {renderContent()}
            </div>

            {activeItem && !isLoading && (
            <div className="border-t border-slate-700 pt-6 space-y-4">
                <DesignLenses onApplyLens={handleRequestRefinement} />

                {isAwaitingRefinementConfirmation ? (
                <div className="bg-slate-900/70 p-4 rounded-lg border border-indigo-500/50 space-y-4">
                    <p className="text-slate-300 font-medium italic">"{refinementConfirmationMessage}"</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        onClick={() => dispatch({ type: 'CONFIRM_REFINEMENT_START' })}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed transform hover:disabled:scale-100 hover:scale-105 shadow-lg shadow-green-600/30"
                    >
                        <CheckIcon className="w-5 h-5"/>
                        Yes, proceed
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'CLARIFY_REFINEMENT' })}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed transform hover:disabled:scale-100 hover:scale-105 shadow-lg shadow-blue-600/30"
                    >
                        <PencilIcon className="w-5 h-5"/>
                        Edit Prompt
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'CANCEL_REFINEMENT' })}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    >
                        <XMarkIcon className="w-5 h-5"/>
                        No, cancel
                    </button>
                    </div>
                </div>
                ) : (
                <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                    <label htmlFor="alteration-prompt" className={`block text-sm font-medium transition-colors ${isMaskActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {isMaskActive ? '3. Describe changes for the selected area' : '3. Refine or Edit your design'}
                    </label>
                    <button
                        onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'designChat' })}
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                        aria-label="Chat with AI for design help"
                        title="Chat with AI for design help"
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'info' })}
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                        aria-label="Show prompt writing tips"
                    >
                        <InformationCircleIcon className="w-5 h-5" />
                    </button>
                    </div>
                    <button
                    onClick={() => dispatch({ type: 'SUGGEST_REFINEMENTS_START' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
                    aria-label="Suggest refinements for the current design"
                    disabled={isSuggestingRefinements}
                    >
                    <LightBulbIcon className="w-4 h-4" />
                    Suggest Ideas
                    </button>
                </div>
                <RefinementSuggestions
                    isLoading={isSuggestingRefinements}
                    suggestions={refinementSuggestions}
                    error={refinementSuggestionError}
                    onApply={(p) => dispatch({ type: 'SET_ALTERATION_PROMPT', payload: p })}
                    onDismiss={() => dispatch({ type: 'DISMISS_REFINEMENT_SUGGESTIONS' })}
                />
                <textarea
                    id="alteration-prompt"
                    rows={3}
                    value={alterationPrompt}
                    onChange={(e) => dispatch({ type: 'SET_ALTERATION_PROMPT', payload: e.target.value })}
                    className={`w-full bg-slate-900/70 border rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:border-indigo-500 transition-all duration-200 resize-none mt-2 ${isMaskActive ? 'border-indigo-500/50 ring-indigo-500/50' : 'border-slate-600'}`}
                    placeholder={isMaskActive ? "e.g., 'Remove these shelves and repair the wall.'" : "e.g., 'Change sofa to green' or 'Add a retro filter'"}
                    aria-label="Refine your design"
                />

                {refinementClarificationMessage && (
                    <div role="alert" className="mt-3 flex items-start gap-3 bg-blue-900/40 border border-blue-700/60 text-blue-200 px-4 py-3 rounded-lg">
                        <ChatBubbleBottomCenterTextIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-400" />
                        <div>
                            <p className="font-semibold">AI Needs Clarification:</p>
                            <p className="text-sm">{refinementClarificationMessage}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mt-3">
                    <button
                        onClick={() => handleRequestRefinement()}
                        disabled={!canAlter || isConfirming}
                        className="w-full flex-grow flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed transform hover:disabled:scale-100 hover:scale-105 animate-[glow_2s_ease-in-out_infinite]"
                        aria-label="Refine room design"
                    >
                        {isConfirming ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <PencilIcon className="w-5 h-5" />
                        )}
                        {isConfirming ? 'Analyzing...' : 'Refine Design'}
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'CREATIVE_EDIT_START' })}
                        disabled={!canAlter || isConfirming}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        aria-label="Apply creative image edit"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Creative Edit
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'TRY_AGAIN_START' })}
                        disabled={!canTryAgain || isConfirming || isLoading}
                        className="px-3 py-3 flex items-center justify-center gap-2 rounded-lg font-semibold text-slate-400 transition-all duration-300 bg-slate-700 hover:bg-slate-600 hover:text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                        aria-label="Undo last change and retry with the same prompt"
                        title="Undo & Retry"
                    >
                        <ArrowPathIcon className="w-5 h-5"/>
                    </button>
                </div>
                </div>
                )}
            </div>
            )}
        </div>
    );
};
