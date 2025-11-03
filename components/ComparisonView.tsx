import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface ComparisonViewProps {
  images: [string, string];
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ images, onClose }) => {
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
      aria-label="Compare Designs"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900/50 border border-slate-700 p-4 rounded-2xl max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 sm:top-2 sm:right-2 text-slate-300 hover:text-white transition-colors z-10"
          aria-label="Close comparison view"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 className="text-center font-semibold text-slate-300 mb-2">Selected History</h3>
                <img
                    src={images[0]}
                    alt="Comparison design one"
                    className="w-full h-auto object-contain rounded-lg"
                />
            </div>
            <div>
                <h3 className="text-center font-semibold text-slate-300 mb-2">Current Design</h3>
                <img
                    src={images[1]}
                    alt="Comparison design two"
                    className="w-full h-auto object-contain rounded-lg"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
