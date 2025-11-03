import React from 'react';
import { AppProvider } from '../state/AppContext';
import { XMarkIcon, InformationCircleIcon } from './icons';

export const InfoModal: React.FC = () => {
  const { state, dispatch } = React.useContext(AppProvider);

  if (!state.ui.isInfoModalOpen) {
    return null;
  }

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">How to Use 3D Room Designer</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>Upload a photo of your room using the upload area</li>
              <li>Wait for AI analysis to identify room features and materials</li>
              <li>Review suggested design styles and choose one, or create your own</li>
              <li>Click "Generate Design" to create your new room design</li>
            </ol>
          </section>

          {/* Design Refinement */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Refining Your Design</h3>
            <p className="text-slate-300 mb-2">
              After generating a design, you can refine it by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
              <li>Using the refinement input to make specific changes</li>
              <li>Trying AI-suggested improvements</li>
              <li>Using advanced editing tools for precise control</li>
            </ul>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Tips for Best Results</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
              <li>Use clear, well-lit photos of your room</li>
              <li>Include the entire room in the photo when possible</li>
              <li>Be specific in your design prompts</li>
              <li>Experiment with different styles and refinements</li>
              <li>Save your favorite designs using the favorite button</li>
            </ul>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Key Features</h3>
            <div className="space-y-3 text-slate-300">
              <div>
                <strong className="text-white">Design History:</strong> View and compare all your design iterations
              </div>
              <div>
                <strong className="text-white">Advanced Mode:</strong> Access creative editing and masking tools
              </div>
              <div>
                <strong className="text-white">Comparison View:</strong> Compare different designs side-by-side
              </div>
              <div>
                <strong className="text-white">AI Chat:</strong> Get design advice and suggestions from AI
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6">
          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
