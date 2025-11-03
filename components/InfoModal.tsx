import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800/80 backdrop-blur-sm p-6 sm:p-8 z-10 border-b border-slate-700">
            <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            aria-label="Close information panel"
            >
            <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 id="info-modal-title" className="text-2xl font-bold text-slate-100">
            Quick Start Guide & Pro Tips
            </h2>
            <p className="text-slate-400 mt-2">
            Get the most out of the Room Designer with this workflow guide.
            </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
            <section>
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Key Features</h3>
                <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                    <li><strong className="text-slate-100">AI Confirmation:</strong> Before making a change, the AI will confirm its understanding of your prompt, giving you a chance to clarify, proceed, or cancel.</li>
                    <li><strong className="text-slate-100">Non-Destructive History:</strong> Your design history is a branching timeline. You can go back to any previous step and explore a completely new design direction without losing your old work.</li>
                    <li><strong className="text-slate-100">Precise Masking Tool:</strong> Use the 'Edit Area' tool to paint over a specific part of the design. Your next prompt will *only* apply to that area.</li>
                </ul>
            </section>

            <div className="border-t border-slate-700/50"></div>

            <section>
                <h3 className="text-xl font-semibold text-slate-200 mb-3">The Design Workflow</h3>
                <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-400">Step 1: Start a Project</h4>
                    <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                        <li><strong className="text-slate-100">Need Inspiration?</strong> After uploading, the AI provides a few creative "Quick Start" suggestions. Click 'Apply' to use one as your starting prompt.</li>
                        <li><strong className="text-slate-100">Get a Clean Slate:</strong> Use the <code className="bg-slate-700 px-1 rounded-sm text-sm">Tidy Up</code> button to remove small clutter, or <code className="bg-slate-700 px-1 rounded-sm text-sm">Empty Room</code> to remove all furniture for a complete redesign.</li>
                    </ul>
                </div>
                <div className="space-y-4 mt-6">
                    <h4 className="font-semibold text-indigo-400">Step 2: Refine Your Vision</h4>
                    <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                        <li><strong className="text-slate-100">Refine vs. Creative Edit:</strong> Choose the right tool. <code className="bg-slate-700 px-1 rounded-sm text-sm">Refine Design</code> is for iterative interior design changes. <code className="bg-slate-700 px-1 rounded-sm text-sm">Creative Edit</code> is for general-purpose, one-off image edits (e.g., "add a retro filter").</li>
                        <li><strong className="text-slate-100">One-Click Ambiance:</strong> Use the 'Design Lenses' (e.g., "Brighter Daylight") for quick mood changes.</li>
                        <li><strong className="text-slate-100">Feeling Stuck?</strong> The <code className="bg-slate-700 px-1 rounded-sm text-sm">Suggest Ideas</code> button analyzes your current design and offers creative ideas for your next step.</li>
                         <li><strong className="text-slate-100">Invert Mask:</strong> In the 'Edit Area' tool, use the 'Invert' button to flip your selection. This is perfect for changing everything *except* the item you've masked.</li>
                    </ul>
                </div>
                <div className="space-y-4 mt-6">
                    <h4 className="font-semibold text-indigo-400">Step 3: Master Your History</h4>
                     <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                        <li><strong className="text-slate-100">Favorite Key Designs:</strong> Click the star icon on a history item to mark it as a favorite.</li>
                        <li><strong className="text-slate-100">A/B Compare:</strong> Click the compare icon on a history item to see it side-by-side with your currently active design.</li>
                        <li><strong className="text-slate-100">Branching Your Designs:</strong> Selecting an older design in the history and making a new refinement creates a new creative branch, allowing you to explore different ideas from any point.</li>
                    </ul>
                </div>
            </section>

            <div className="border-t border-slate-700/50"></div>

            <section>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">Pro-Tip: The Golden Rule of Prompting</h3>
                <p className="text-slate-300 mb-3">
                    Imagine giving a command to a very literal photo editor. The more specific your instructions, the better the result.
                </p>
                <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                    <li><strong className="text-slate-100">Use Action Verbs:</strong> Start with <code className="bg-slate-700 px-1 rounded-sm text-sm">Replace</code>, <code className="bg-slate-700 px-1 rounded-sm text-sm">Add</code>, <code className="bg-slate-700 px-1 rounded-sm text-sm">Remove</code>, or <code className="bg-slate-700 px-1 rounded-sm text-sm">Change</code>.</li>
                    <li><strong className="text-slate-100">Instruct the Repair:</strong> When removing something, tell the AI how to fill the empty space (e.g., "...and repair the wall behind it to match.").</li>
                    <li><strong className="text-slate-100">Be Descriptive:</strong> Instead of "add a lamp," try "add a sleek, black metal arc floor lamp."</li>
                </ul>
            </section>

            <div className="border-t border-slate-700/50"></div>

            <section>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Power User Features</h3>
                <ul className="list-disc list-outside space-y-2 pl-5 text-slate-300">
                    <li><strong className="text-slate-100">Advanced AI Mode:</strong> Use the toggle in the header to activate a more powerful AI model (<code className="bg-slate-700 px-1 rounded-sm text-sm">gemini-2.5-pro</code>). It provides more creative suggestions but takes longer to generate them.</li>
                    <li><strong className="text-slate-100">Save & Load Projects:</strong> Use the header buttons to save your entire session to a <code className="bg-slate-700 px-1 rounded-sm text-sm">.roomdesigner</code> file. You can load this file later to pick up right where you left off.</li>
                </ul>
            </section>
        </div>
      </div>
    </div>
  );
};
