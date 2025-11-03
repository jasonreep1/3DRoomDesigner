import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    // Add event listener to close lightbox on 'Escape' key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged room design"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full"
        // Prevent clicks inside the image container from closing the modal
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:top-2 sm:right-2 text-slate-300 hover:text-white transition-colors z-10"
          aria-label="Close lightbox"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <img
          src={imageUrl}
          alt="Enlarged room design"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};
