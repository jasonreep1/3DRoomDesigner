import React, { useCallback, useRef, useReducer, useContext } from 'react';
import { AppProvider, appReducer, initialState } from './state/AppContext';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { Lightbox } from './components/Lightbox';
import { MaskingEditor } from './components/MaskingEditor';
import { InfoModal } from './components/InfoModal';
import { RoomAnalysis } from './components/RoomAnalysis';
import { DesignSuggestions } from './components/DesignSuggestions';
import { ComparisonView } from './components/ComparisonView';
import { DesignChatModal } from './components/DesignChatModal';
import { ExclamationTriangleIcon, ChatBubbleLeftRightIcon } from './components/icons';
import { fileToBase64, dataUrlToBase64 } from './utils/fileUtils';
import {
  generateFullImageDesign,
  generateMaskedImageDesign,
  analyzeImageForSuggestions,
  analyzeImageForRefinements,
  generateCleanedImage,
  generateCreativeImageEdit,
  analyzeImageForRoomDetails,
  planAndConfirmRefinement,
  describeImageChanges,
  critiqueGeneratedImage
} from './services/geminiService';
import { HistoryItem } from './components/HistoryPanel';

const AppContent: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleLoadProject } = useContext(AppProvider);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col p-4 sm:p-6 lg:p-8">
      <AppModals />

      <Header onLoadProjectClick={() => fileInputRef.current?.click()} />
      <input type="file" ref={fileInputRef} className="hidden" accept=".roomdesigner" onChange={handleLoadProject} />

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 items-start">
        <div className="flex flex-col gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <ImageUploader />
          <RoomAnalysis />
          <DesignSuggestions />
          <MainGenerator />
          <AppError />
          <HistoryPanel />
        </div>
        <div className="lg:sticky lg:top-8">
          <ResultDisplay />
        </div>
      </main>
      <footer className="text-center text-slate-500 text-sm mt-8">
        <p>Powered by Gemini AI. Designs are for inspirational purposes.</p>
      </footer>
    </div>
  );
};

const AppModals: React.FC = () => {
    const { state, dispatch } = React.useContext(AppProvider);
    const { activeItem, originalImageData } = state;

    const chatContextItem = activeItem ? activeItem : originalImageData ? {
        imageUrl: `data:${originalImageData.mimeType};base64,${originalImageData.base64}`,
        imageData: originalImageData
    } : null;

    return (
        <>
            {state.ui.isLightboxOpen && activeItem && (
                <Lightbox imageUrl={activeItem.imageUrl} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
            )}
            {state.ui.isComparisonViewOpen && state.ui.comparisonImages && (
                <ComparisonView images={state.ui.comparisonImages} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
            )}
            {state.ui.isMaskingEditorOpen && activeItem && (
                <MaskingEditor
                imageUrl={activeItem.imageUrl}
                onSave={(mask) => dispatch({ type: 'SET_MASK_DATA_URL', payload: mask })}
                onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
                />
            )}
            {state.ui.isInfoModalOpen && <InfoModal onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />}
            {state.ui.isDesignChatOpen && chatContextItem && (
                <DesignChatModal
                    contextItem={chatContextItem}
                    onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
                    onCopyToPrompt={(prompt) => {
                        const actionType = activeItem ? 'SET_ALTERATION_PROMPT' : 'SET_PROMPT';
                        dispatch({ type: actionType, payload: prompt });
                    }}
                />
            )}
        </>
    )
}

const MainGenerator: React.FC = () => {
    const { state, dispatch } = React.useContext(AppProvider);
    const { status, originalImageData, prompt, history } = state;
    const isLoading = status === 'generating';

    const handleGenerate = () => {
        if (originalImageData && prompt) {
            dispatch({ type: 'GENERATE_START', payload: { originalImageData, prompt } });
        }
    };

    if (history.length > 0) return null;

    return (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
                2. Describe your dream room
              </label>
              <button
                  onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'designChat' })}
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                  aria-label="Chat with AI for design help"
                  title="Chat with AI for design help"
                  disabled={!originalImageData}
              >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </button>
            </div>
            <textarea
              id="prompt"
              rows={6}
              value={prompt}
              onChange={(e) => dispatch({ type: 'SET_PROMPT', payload: e.target.value })}
              className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
              placeholder="e.g., 'Make the walls light blue, add a mid-century modern sofa, a plush rug, and warm ambient lighting.'"
              aria-label="Describe your dream room"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!originalImageData || prompt.trim().length === 0 || isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transform hover:disabled:scale-100 hover:scale-105 shadow-lg shadow-indigo-600/30"
            aria-label="Generate room design"
          >
            Generate Design
          </button>
        </>
    )
}

const AppError: React.FC = () => {
    const { state } = React.useContext(AppProvider);
    const { errorMessage } = state;
    if (!errorMessage) return null;

    return (
        <div role="alert" className="flex items-center gap-3 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
        </div>
    );
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addResultToHistory = useCallback((newPrompt: string, newImageData: { base64: string, mimeType: string }, changeDescription: string, isFailure: boolean = false) => {
    const { history, activeHistoryId } = state;
    const imageUrl = `data:${newImageData.mimeType};base64,${newImageData.base64}`;
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      prompt: newPrompt,
      imageUrl,
      imageData: newImageData,
      isFavorite: false,
      changeDescription,
      isFailure,
    };

    const parentIndex = history.findIndex(item => item.id === activeHistoryId);
    const baseHistory = parentIndex > -1 ? history.slice(0, parentIndex + 1) : history;
    const newHistory = [...baseHistory, newHistoryItem];

    dispatch({ type: 'ADD_HISTORY_ITEM_SUCCESS', payload: { history: newHistory, activeId: newHistoryItem.id }});

  }, [state, dispatch]);

  // This effect handles all async operations based on the app's status
  React.useEffect(() => {
    const processRequest = async () => {
      // Analysis after upload
      if (state.status === 'analyzing' && state.originalImageData) {
        try {
          const { base64, mimeType } = state.originalImageData;
          const [analysisResult, suggestions] = await Promise.all([
            analyzeImageForRoomDetails(base64, mimeType, state.isAdvancedMode),
            analyzeImageForSuggestions(base64, mimeType, state.isAdvancedMode)
          ]);
          dispatch({ type: 'UPLOAD_IMAGE_SUCCESS', payload: { roomAnalysis: analysisResult, suggestions }});
        } catch (err) {
          dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Could not analyze image.' });
        }
      }

      // Initial generation
      if (state.status === 'generating' && state.originalImageData && state.prompt) {
        try {
          const generatedBase64 = await generateFullImageDesign({ original: state.originalImageData, prompt: state.prompt });
          const newImageData = { base64: generatedBase64, mimeType: state.originalImageData.mimeType };
          const changeDescription = await describeImageChanges(state.originalImageData, newImageData, state.prompt, state.isAdvancedMode);
          addResultToHistory(state.prompt, newImageData, changeDescription);
        } catch (err) {
            dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Failed to generate design.' });
        }
      }

      // Clean generation
      if (state.status === 'cleaning' && state.originalImageData && state.cleanLevel) {
          try {
            const generatedBase64 = await generateCleanedImage(state.originalImageData, state.cleanLevel);
            const promptText = state.cleanLevel === 'tidy' ? "Tidied up the room." : "Emptied the room.";
            const newImageData = { base64: generatedBase64, mimeType: state.originalImageData.mimeType };
            const changeDescription = await describeImageChanges(state.originalImageData, newImageData, promptText, state.isAdvancedMode);
            addResultToHistory(promptText, newImageData, changeDescription);
          } catch(err) {
            dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Failed to clean image.' });
          }
      }

      // Requesting refinement confirmation
      if (state.status === 'confirming_refinement' && state.activeItem && state.refinementPrompt) {
        try {
          const { base64, mimeType } = state.activeItem.imageData;
          const base64Mask = state.maskDataUrl ? dataUrlToBase64(state.maskDataUrl) : null;

          const planResult = await planAndConfirmRefinement(
              base64,
              mimeType,
              state.refinementPrompt,
              state.isAdvancedMode,
              base64Mask
          );

          switch (planResult.type) {
            case 'PROPOSAL':
            case 'WARNING':
                dispatch({ type: 'REQUEST_REFINEMENT_CONFIRMATION_READY', payload: planResult.message });
                break;
            case 'CLARIFICATION':
                dispatch({ type: 'REFINEMENT_CLARIFICATION_NEEDED', payload: planResult.message });
                break;
          }

        } catch (err) {
            dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Could not get confirmation.' });
        }
      }

      // Refinement generation (masked or full)
      if (state.status === 'refining' && state.originalImageData && state.activeItem && state.refinementPrompt) {
          try {
            const { imageData: lastImageData, prompt: previousPrompt } = state.activeItem;
            let generatedBase64: string;

            if (state.maskDataUrl) {
                const base64Mask = dataUrlToBase64(state.maskDataUrl);
                generatedBase64 = await generateMaskedImageDesign(lastImageData.base64, lastImageData.mimeType, base64Mask, state.refinementPrompt, previousPrompt);
            } else {
                generatedBase64 = await generateFullImageDesign({
                    original: state.originalImageData,
                    previous: lastImageData,
                    prompt: state.refinementPrompt,
                    previousPrompt: previousPrompt,
                    critiqueFeedback: state.refinementCritiqueReason,
                });
            }
            const newImageData = { base64: generatedBase64, mimeType: lastImageData.mimeType };

            // Instead of adding to history, send for critique. The description will be generated after success.
            dispatch({ type: 'REFINEMENT_GENERATION_SUCCESS', payload: { newImageData }});

          } catch(err) {
            dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Failed to refine design.' });
          }
      }

      // AI Self-Correction Step
      if (state.status === 'refining_critiquing' && state.activeItem && state.refinementCandidate && state.refinementPrompt) {
        try {
            const critique = await critiqueGeneratedImage(state.activeItem.imageData, state.refinementCandidate.newImageData, state.refinementPrompt);
            if (critique.success) {
                const changeDescription = await describeImageChanges(state.activeItem.imageData, state.refinementCandidate.newImageData, state.refinementPrompt, state.isAdvancedMode);
                addResultToHistory(state.refinementPrompt, state.refinementCandidate.newImageData, changeDescription);
            } else {
                if (state.refinementRetryCount < 1) {
                    dispatch({ type: 'REFINEMENT_RETRY', payload: critique.reason });
                } else {
                    const failureDescription = `I wasn't able to make that change. The AI's self-critique was: "${critique.reason}"`;
                    addResultToHistory(state.refinementPrompt, state.activeItem.imageData, failureDescription, true);
                }
            }
        } catch (err) {
            // If critique fails, assume the image is okay and proceed.
            console.error("Critique failed, proceeding with generated image.", err);
             const changeDescription = await describeImageChanges(state.activeItem.imageData, state.refinementCandidate.newImageData, state.refinementPrompt, state.isAdvancedMode);
            addResultToHistory(state.refinementPrompt, state.refinementCandidate.newImageData, changeDescription);
        }
      }

      // Creative Edit
      if (state.status === 'creative_editing' && state.activeItem && state.refinementPrompt) {
          try {
            const { imageData } = state.activeItem;
            const generatedBase64 = await generateCreativeImageEdit(imageData, state.refinementPrompt);
            const newImageData = { base64: generatedBase64, mimeType: imageData.mimeType };
            const changeDescription = await describeImageChanges(imageData, newImageData, state.refinementPrompt, state.isAdvancedMode);
            addResultToHistory(`(Creative Edit) ${state.refinementPrompt}`, newImageData, changeDescription);
          } catch(err) {
            dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Failed to apply creative edit.' });
          }
      }

      // Suggesting Refinements
      if (state.status === 'suggesting_refinements' && state.activeItem) {
          try {
              const { base64, mimeType } = state.activeItem.imageData;
              const suggestions = await analyzeImageForRefinements(base64, mimeType, state.isAdvancedMode);
              dispatch({ type: 'SUGGEST_REFINEMENTS_SUCCESS', payload: suggestions });
          } catch(err) {
              dispatch({ type: 'API_ERROR', payload: err instanceof Error ? err.message : 'Failed to suggest refinements.' });
          }
      }

    };

    processRequest();
  }, [state.status, state.originalImageData, state.prompt, state.activeItem, state.refinementPrompt, state.isAdvancedMode, state.maskDataUrl, state.cleanLevel, state.refinementCandidate, state.refinementRetryCount, state.refinementCritiqueReason, dispatch, addResultToHistory]);


  const handleImageUpload = useCallback(async (file: File) => {
    dispatch({ type: 'UPLOAD_IMAGE_START' });
    try {
      const base64 = await fileToBase64(file);
      const imageData = { base64, mimeType: file.type };
      dispatch({ type: 'UPLOAD_IMAGE_PROCESSING', payload: imageData });
    } catch (err) {
      dispatch({ type: 'API_ERROR', payload: 'Could not process image file.' });
    }
  }, [dispatch]);

  const handleLoadProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    dispatch({ type: 'LOAD_PROJECT_START' });
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result !== 'string') throw new Error("File is not readable.");
            const projectData = JSON.parse(result);
            if (projectData.version === 1 && projectData.originalImageData && projectData.history) {
                dispatch({ type: 'LOAD_PROJECT_SUCCESS', payload: projectData });
            } else {
                throw new Error("Invalid or corrupted project file.");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Could not load the project file.");
            dispatch({ type: 'LOAD_PROJECT_ERROR' });
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [dispatch]);

  // Provide a memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    handleImageUpload,
    handleLoadProject,
  }), [state, dispatch, handleImageUpload, handleLoadProject]);

  return (
    <AppProvider.Provider value={contextValue}>
      <AppContent />
    </AppProvider.Provider>
  );
};

export default App;
