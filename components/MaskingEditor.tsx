import React, { useRef, useState, useEffect } from 'react';
import { AppProvider } from '../state/AppContext';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from './icons';

export const MaskingEditor: React.FC = () => {
  const { state, dispatch } = React.useContext(AppProvider);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  useEffect(() => {
    if (state.ui.isMaskingEditorOpen && state.activeItem && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.activeItem.imageUrl;
    }
  }, [state.ui.isMaskingEditorOpen, state.activeItem]);

  if (!state.ui.isMaskingEditorOpen || !state.activeItem) {
    return null;
  }

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const maskDataUrl = canvasRef.current.toDataURL();
      dispatch({ type: 'SET_MASK_DATA_URL', payload: maskDataUrl });
    }
  };

  const handleClear = () => {
    if (canvasRef.current && state.activeItem) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.activeItem.imageUrl;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mask Editor</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-slate-300 text-sm mb-4">
              Paint over the areas you want to modify. The AI will focus changes on the masked regions.
            </p>
          </div>

          <div className="flex justify-center mb-4 bg-slate-900 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="max-w-full h-auto border border-slate-600 rounded cursor-crosshair"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-slate-300 text-sm">
                Brush Size:
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-slate-400 text-sm">{brushSize}px</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save Mask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
