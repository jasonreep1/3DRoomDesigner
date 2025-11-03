import React, { useState, useCallback, useRef } from 'react';
import { AppProvider } from '../state/AppContext';
import { PhotoIcon, CheckCircleIcon } from './icons';

export const ImageUploader: React.FC = () => {
  const { handleImageUpload } = React.useContext(AppProvider);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setFileName(file.name);
        handleImageUpload(file);
      } else {
          alert("Please upload a JPG or PNG image.");
      }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
            1. Upload a photo of your room
        </label>
        <div
            className="relative w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center cursor-pointer hover:border-indigo-500 transition-colors duration-300 bg-slate-900/50"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
            />
            {imagePreview ? (
                <>
                    <img src={imagePreview} alt="Room preview" className="w-full h-full object-contain rounded-lg p-2" />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-green-900/80 backdrop-blur-sm text-green-200 px-3 py-1.5 rounded-full text-xs font-semibold border border-green-700">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>{fileName}</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-slate-500">
                    <PhotoIcon className="w-12 h-12 mb-2" />
                    <span className="font-semibold text-slate-400">Click to upload or drag & drop</span>
                    <span className="text-sm">PNG or JPG</span>
                </div>
            )}
        </div>
    </div>
  );
};
