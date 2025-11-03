import React from 'react';
import { AppProvider } from '../state/AppContext';
import { ClockIcon, StarIcon, ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from './icons';

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  imageData: {
    base64: string;
    mimeType: string;
  };
  isFavorite?: boolean;
  changeDescription?: string;
  isFailure?: boolean;
}

export const HistoryPanel: React.FC = () => {
  const { state, dispatch } = React.useContext(AppProvider);
  const { history, activeHistoryId } = state;

  if (history.length === 0) {
      return null;
  }

  return (
    <div className="border-t border-slate-700 pt-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-slate-400" />
        Design History
      </h3>
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2 -mr-2">
        {history.slice().reverse().map((item) => {
            const isFailure = item.isFailure;
            const isActive = activeHistoryId === item.id;
            return (
              <div
                key={item.id}
                className={`relative w-full flex items-center gap-4 p-2 rounded-lg text-left transition-all duration-200 border-2 ${
                  isActive
                    ? 'bg-slate-800/50 border-indigo-500'
                    : 'bg-slate-900/70 border-transparent hover:border-slate-700'
                }`}
              >
                <button onClick={() => dispatch({ type: 'SELECT_HISTORY_ITEM', payload: item })} className="flex-grow flex items-center gap-4 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt="Design history thumbnail"
                    className="w-16 h-12 object-cover rounded-md flex-shrink-0 bg-slate-700"
                  />
                  <div className="flex-grow overflow-hidden pr-16">
                     <p className="text-sm text-slate-300 truncate font-medium">
                        {item.prompt}
                     </p>
                     {item.changeDescription && item.changeDescription.trim() && (
                        <p className={`text-xs mt-1 flex items-start gap-1.5 ${isFailure ? 'text-amber-400/80' : 'text-slate-400'}`}>
                            {isFailure ? (
                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                            ) : (
                                <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                            )}
                            <span className="truncate">{item.changeDescription}</span>
                        </p>
                     )}
                  </div>
                </button>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => dispatch({ type: 'COMPARE_HISTORY_ITEM', payload: item.id })}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-600/50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={activeHistoryId === item.id}
                    aria-label="Compare with current"
                    title="Compare with current"
                  >
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: item.id })}
                    className={`p-1.5 rounded-full transition-colors ${item.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}`}
                    aria-label={item.isFavorite ? "Unfavorite this item" : "Favorite this item"}
                    title={item.isFavorite ? "Unfavorite" : "Favorite"}
                  >
                    <StarIcon solid={item.isFavorite} className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};
