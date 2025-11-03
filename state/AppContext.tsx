import React from 'react';
import { HistoryItem } from '../components/HistoryPanel';
import { Suggestion } from '../components/DesignSuggestions';

// Data shapes
type ImageData = { base64: string; mimeType: string };
type RoomAnalysisData = { description: string; materials: string[] };
type RefinementCandidate = { newImageData: ImageData };

// The entire state of our application
export interface AppState {
    status: 'idle' | 'analyzing' | 'generating' | 'refining' | 'confirming_refinement' | 'awaiting_confirmation' | 'creative_editing' | 'cleaning' | 'suggesting_refinements' | 'refining_critiquing' | 'error';
    originalImageData: ImageData | null;
    prompt: string;
    alterationPrompt: string;
    refinementPrompt: string; // The prompt currently being processed in a refinement flow
    history: HistoryItem[];
    activeHistoryId: string | null;
    activeItem: HistoryItem | null;
    maskDataUrl: string | null;
    isAdvancedMode: boolean;
    cleanLevel: 'tidy' | 'empty' | null;

    // Analysis and suggestions
    roomAnalysis: RoomAnalysisData | null;
    designSuggestions: Suggestion[];
    refinementSuggestions: Suggestion[];
    analysisError: string | null;
    refinementSuggestionError: string | null;

    // Refinement flow
    refinementConfirmationMessage: string | null;
    refinementClarificationMessage: string | null;
    refinementRetryCount: number;
    refinementCandidate: RefinementCandidate | null;
    refinementCritiqueReason: string | null;


    // General UI state
    errorMessage: string | null;
    ui: {
        isLightboxOpen: boolean;
        isMaskingEditorOpen: boolean;
        isInfoModalOpen: boolean;
        isComparisonViewOpen: boolean;
        isDesignChatOpen: boolean;
        areInitialSuggestionsVisible: boolean;
        showSuggestionsList: boolean;
        comparisonImages: [string, string] | null;
    };
}

// All possible actions that can be dispatched
export type AppAction =
  | { type: 'RESET_STATE' }
  | { type: 'UPLOAD_IMAGE_START' }
  | { type: 'UPLOAD_IMAGE_PROCESSING', payload: ImageData }
  | { type: 'UPLOAD_IMAGE_SUCCESS', payload: { roomAnalysis: RoomAnalysisData, suggestions: Suggestion[] } }
  | { type: 'SET_PROMPT', payload: string }
  | { type: 'SET_ALTERATION_PROMPT', payload: string }
  | { type: 'GENERATE_START', payload: { originalImageData: ImageData, prompt: string } }
  | { type: 'CLEAN_START', payload: 'tidy' | 'empty' }
  | { type: 'ADD_HISTORY_ITEM_SUCCESS', payload: { history: HistoryItem[], activeId: string } }
  | { type: 'SELECT_HISTORY_ITEM', payload: HistoryItem }
  | { type: 'REQUEST_REFINEMENT_START', payload: string }
  | { type: 'REQUEST_REFINEMENT_CONFIRMATION_READY', payload: string }
  | { type: 'REFINEMENT_CLARIFICATION_NEEDED', payload: string }
  | { type: 'DISMISS_CLARIFICATION_MESSAGE' }
  | { type: 'CONFIRM_REFINEMENT_START' }
  | { type: 'REFINEMENT_GENERATION_SUCCESS', payload: RefinementCandidate }
  | { type: 'REFINEMENT_RETRY', payload: string }
  | { type: 'CANCEL_REFINEMENT' }
  | { type: 'CLARIFY_REFINEMENT' }
  | { type: 'TRY_AGAIN_START' }
  | { type: 'CREATIVE_EDIT_START' }
  | { type: 'SET_MASK_DATA_URL', payload: string }
  | { type: 'TOGGLE_FAVORITE', payload: string }
  | { type: 'COMPARE_HISTORY_ITEM', payload: string }
  | { type: 'TOGGLE_ADVANCED_MODE' }
  | { type: 'DISMISS_INITIAL_SUGGESTIONS' }
  | { type: 'SHOW_INITIAL_SUGGESTIONS_LIST' }
  | { type: 'DISMISS_REFINEMENT_SUGGESTIONS' }
  | { type: 'SUGGEST_REFINEMENTS_START' }
  | { type: 'SUGGEST_REFINEMENTS_SUCCESS', payload: Suggestion[] }
  | { type: 'API_ERROR', payload: string }
  | { type: 'OPEN_MODAL', payload: 'lightbox' | 'maskingEditor' | 'info' | 'comparisonView' | 'designChat' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'LOAD_PROJECT_START' }
  | { type: 'LOAD_PROJECT_SUCCESS', payload: { originalImageData: ImageData, history: HistoryItem[] }}
  | { type: 'LOAD_PROJECT_ERROR' };


export const initialState: AppState = {
    status: 'idle',
    originalImageData: null,
    prompt: '',
    alterationPrompt: '',
    refinementPrompt: '',
    history: [],
    activeHistoryId: null,
    activeItem: null,
    maskDataUrl: null,
    isAdvancedMode: false,
    cleanLevel: null,
    roomAnalysis: null,
    designSuggestions: [],
    refinementSuggestions: [],
    analysisError: null,
    refinementSuggestionError: null,
    refinementConfirmationMessage: null,
    refinementClarificationMessage: null,
    refinementRetryCount: 0,
    refinementCandidate: null,
    refinementCritiqueReason: null,
    errorMessage: null,
    ui: {
        isLightboxOpen: false,
        isMaskingEditorOpen: false,
        isInfoModalOpen: false,
        isComparisonViewOpen: false,
        isDesignChatOpen: false,
        areInitialSuggestionsVisible: false,
        showSuggestionsList: false,
        comparisonImages: null,
    },
};

const clearRefinementState = (state: AppState): AppState => ({
    ...state,
    alterationPrompt: '',
    refinementPrompt: '',
    maskDataUrl: null,
    refinementSuggestions: [],
    refinementSuggestionError: null,
    refinementConfirmationMessage: null,
    refinementClarificationMessage: null,
    refinementRetryCount: 0,
    refinementCandidate: null,
    refinementCritiqueReason: null,
});


export const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'RESET_STATE':
            return initialState;

        case 'UPLOAD_IMAGE_START':
            return {
                ...initialState,
                status: 'idle',
                isAdvancedMode: state.isAdvancedMode
            };

        case 'UPLOAD_IMAGE_PROCESSING':
            return {
                ...state,
                status: 'analyzing',
                originalImageData: action.payload,
                analysisError: null,
                roomAnalysis: null,
                designSuggestions: [],
            };

        case 'UPLOAD_IMAGE_SUCCESS':
            return {
                ...state,
                status: 'idle',
                roomAnalysis: action.payload.roomAnalysis,
                designSuggestions: action.payload.suggestions,
                ui: { ...state.ui, areInitialSuggestionsVisible: true }
            };

        case 'SET_PROMPT':
            return { ...state, prompt: action.payload };

        case 'SET_ALTERATION_PROMPT':
            return {
                ...state,
                alterationPrompt: action.payload,
                refinementClarificationMessage: null, // Dismiss clarification on typing
             };

        case 'GENERATE_START':
            return {
                ...state,
                status: 'generating',
                errorMessage: null,
                history: [],
                activeHistoryId: null,
                activeItem: null,
            };

        case 'CLEAN_START':
            return {
                ...state,
                status: 'cleaning',
                cleanLevel: action.payload,
                errorMessage: null,
                prompt: '',
                history: [],
                activeHistoryId: null,
                activeItem: null,
                ui: { ...state.ui, areInitialSuggestionsVisible: false },
            };

        case 'ADD_HISTORY_ITEM_SUCCESS':
            const newActiveItem = action.payload.history.find(item => item.id === action.payload.activeId) ?? null;
            return {
                ...clearRefinementState(state),
                status: 'idle',
                history: action.payload.history,
                activeHistoryId: action.payload.activeId,
                activeItem: newActiveItem,
            };

        case 'SELECT_HISTORY_ITEM':
            return {
                ...clearRefinementState(state),
                status: 'idle',
                activeHistoryId: action.payload.id,
                activeItem: action.payload,
                errorMessage: null,
            };

        case 'REQUEST_REFINEMENT_START':
            return {
                ...state,
                status: 'confirming_refinement',
                refinementPrompt: action.payload,
                errorMessage: null,
                refinementClarificationMessage: null,
            };

        case 'REQUEST_REFINEMENT_CONFIRMATION_READY':
            return {
                ...state,
                status: 'awaiting_confirmation',
                refinementConfirmationMessage: action.payload,
            };

        case 'REFINEMENT_CLARIFICATION_NEEDED':
            return {
                ...state,
                status: 'idle',
                refinementPrompt: '', // Clear the in-flight prompt
                alterationPrompt: state.refinementPrompt, // Put the prompt back in the box
                refinementClarificationMessage: action.payload,
            };

        case 'DISMISS_CLARIFICATION_MESSAGE':
            return {
                ...state,
                refinementClarificationMessage: null,
            };

        case 'CONFIRM_REFINEMENT_START':
            return {
                ...state,
                status: 'refining',
                errorMessage: null,
                refinementConfirmationMessage: null,
                refinementRetryCount: 0,
                refinementCandidate: null,
            }

        case 'REFINEMENT_GENERATION_SUCCESS':
            return {
                ...state,
                status: 'refining_critiquing',
                refinementCandidate: action.payload,
            };

        case 'REFINEMENT_RETRY':
            return {
                ...state,
                status: 'refining',
                refinementRetryCount: state.refinementRetryCount + 1,
                refinementCandidate: null,
                refinementCritiqueReason: action.payload,
            };

        case 'CANCEL_REFINEMENT':
            return {
                ...state,
                status: 'idle',
                alterationPrompt: state.refinementPrompt, // Keep prompt in box
                refinementPrompt: '',
                refinementConfirmationMessage: null,
            }

        case 'CLARIFY_REFINEMENT':
            return {
                ...state,
                status: 'idle',
                alterationPrompt: state.refinementPrompt, // Keep prompt in box
                refinementPrompt: '',
                refinementConfirmationMessage: null,
            }

        case 'TRY_AGAIN_START':
            if (state.history.length === 0 || !state.activeItem) return state;

            const parentIndex = state.history.findIndex(h => h.id === state.activeHistoryId);
            if (parentIndex < 0) return state; // Should not happen

            const failedPrompt = state.activeItem.prompt;
            const parentItem = parentIndex > 0 ? state.history[parentIndex - 1] : null;

            // If there's no parent, we are retrying the first generation from the original image.
            if (!parentItem) {
                return {
                    ...initialState, // Start over
                    originalImageData: state.originalImageData,
                    roomAnalysis: state.roomAnalysis,
                    designSuggestions: state.designSuggestions,
                    isAdvancedMode: state.isAdvancedMode,
                    prompt: failedPrompt, // Repopulate the initial prompt
                    status: 'idle'
                }
            }

            return {
                ...clearRefinementState(state),
                status: 'confirming_refinement',
                history: state.history.slice(0, parentIndex),
                activeHistoryId: parentItem.id,
                activeItem: parentItem,
                refinementPrompt: failedPrompt,
                alterationPrompt: failedPrompt,
            }

        case 'CREATIVE_EDIT_START':
            return {
                ...state,
                status: 'creative_editing',
                refinementPrompt: state.alterationPrompt,
                errorMessage: null,
            }

        case 'SET_MASK_DATA_URL':
            return {
                ...state,
                maskDataUrl: action.payload,
                ui: { ...state.ui, isMaskingEditorOpen: false },
            };

        case 'TOGGLE_FAVORITE':
            return {
                ...state,
                history: state.history.map(item =>
                    item.id === action.payload ? { ...item, isFavorite: !item.isFavorite } : item
                ),
            };

        case 'COMPARE_HISTORY_ITEM':
             const itemToCompare = state.history.find(item => item.id === action.payload);
             if (itemToCompare && state.activeItem && itemToCompare.id !== state.activeItem.id) {
                 return {
                     ...state,
                     ui: {
                         ...state.ui,
                         isComparisonViewOpen: true,
                         comparisonImages: [itemToCompare.imageUrl, state.activeItem.imageUrl]
                     }
                 }
             }
             return state;

        case 'TOGGLE_ADVANCED_MODE':
            return { ...state, isAdvancedMode: !state.isAdvancedMode };

        case 'DISMISS_INITIAL_SUGGESTIONS':
            return { ...state, ui: { ...state.ui, areInitialSuggestionsVisible: false } };

        case 'SHOW_INITIAL_SUGGESTIONS_LIST':
            return { ...state, ui: { ...state.ui, showSuggestionsList: true } };

        case 'DISMISS_REFINEMENT_SUGGESTIONS':
            return { ...state, refinementSuggestions: [] };

        case 'SUGGEST_REFINEMENTS_START':
            return {
                ...state,
                status: 'suggesting_refinements',
                refinementSuggestions: [],
                refinementSuggestionError: null,
            };

        case 'SUGGEST_REFINEMENTS_SUCCESS':
            return {
                ...state,
                status: 'idle',
                refinementSuggestions: action.payload,
            };

        case 'API_ERROR':
            const isSuggestionError = state.status === 'suggesting_refinements';
            return {
                ...state,
                status: 'error',
                errorMessage: isSuggestionError ? state.errorMessage : action.payload,
                analysisError: state.status === 'analyzing' ? action.payload : state.analysisError,
                refinementSuggestionError: isSuggestionError ? action.payload : state.refinementSuggestionError,
                refinementCandidate: null,
            };

        case 'OPEN_MODAL':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isLightboxOpen: action.payload === 'lightbox',
                    isMaskingEditorOpen: action.payload === 'maskingEditor',
                    isInfoModalOpen: action.payload === 'info',
                    isComparisonViewOpen: action.payload === 'comparisonView',
                    isDesignChatOpen: action.payload === 'designChat',
                }
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isLightboxOpen: false,
                    isMaskingEditorOpen: false,
                    isInfoModalOpen: false,
                    isComparisonViewOpen: false,
                    isDesignChatOpen: false,
                }
            };

        case 'LOAD_PROJECT_SUCCESS':
            const loadedHistory = action.payload.history;
            const lastItem = loadedHistory[loadedHistory.length - 1] ?? null;
            return {
                ...initialState,
                originalImageData: action.payload.originalImageData,
                history: loadedHistory,
                activeHistoryId: lastItem?.id || null,
                activeItem: lastItem,
            };

        case 'LOAD_PROJECT_ERROR':
        case 'LOAD_PROJECT_START':
            return state;

        default:
            return state;
    }
};

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    handleImageUpload: (file: File) => Promise<void>;
    handleLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppProvider = React.createContext<AppContextType>(null!);
