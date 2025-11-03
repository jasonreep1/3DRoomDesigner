import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { XMarkIcon, PaintBrushIcon, EraserIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowPathIcon } from './icons';

interface MaskingEditorProps {
  imageUrl: string;
  onSave: (maskDataUrl: string) => void;
  onClose: () => void;
}

type Tool = 'brush' | 'eraser';

export const MaskingEditor: React.FC<MaskingEditorProps> = ({ imageUrl, onSave, onClose }) => {
  const dataCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden, high-res canvas
  const displayCanvasRef = useRef<HTMLCanvasElement>(null); // Visible, screen-sized canvas
  const imageRef = useRef<HTMLImageElement>(null); // For getting natural image dimensions on load
  const visibleImageRef = useRef<HTMLImageElement>(null); // For observing displayed image dimensions

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [softEdge, setSoftEdge] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Using a ref to hold the latest callbacks for use in the keyboard event listener.
  // This prevents the need to re-add the listener every time the callbacks change.
  const callbacksRef = useRef({ undo: () => {}, redo: () => {}, onClose: () => {} });

  const getDisplayCtx = () => displayCanvasRef.current?.getContext('2d');
  const getDataCtx = () => dataCanvasRef.current?.getContext('2d', { willReadFrequently: true });

  const syncDisplayCanvas = useCallback(() => {
    const displayCtx = getDisplayCtx();
    const dataCanvas = dataCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (displayCtx && dataCanvas && displayCanvas) {
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.drawImage(dataCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
    }
  }, []);

  const saveToHistory = useCallback(() => {
    const dataCtx = getDataCtx();
    if (dataCtx && dataCanvasRef.current) {
        const imageData = dataCtx.getImageData(0, 0, dataCanvasRef.current.width, dataCanvasRef.current.height);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex]);

  const initializeCanvases = useCallback(() => {
    const dataCanvas = dataCanvasRef.current;
    const image = imageRef.current;
    const dataCtx = getDataCtx();
    if (dataCanvas && image && dataCtx && image.naturalWidth > 0) {
      dataCanvas.width = image.naturalWidth;
      dataCanvas.height = image.naturalHeight;
      dataCtx.fillStyle = 'black';
      dataCtx.fillRect(0, 0, dataCanvas.width, dataCanvas.height);
      saveToHistory();
    }
  }, [saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const dataCtx = getDataCtx();
        if (dataCtx) {
            dataCtx.putImageData(history[newIndex], 0, 0);
            syncDisplayCanvas();
        }
    }
  }, [history, historyIndex, syncDisplayCanvas]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const dataCtx = getDataCtx();
        if (dataCtx) {
            dataCtx.putImageData(history[newIndex], 0, 0);
            syncDisplayCanvas();
        }
    }
  }, [history, historyIndex, syncDisplayCanvas]);

  useEffect(() => {
    callbacksRef.current = { undo, redo, onClose };
  }, [undo, redo, onClose]);


  const invertMask = () => {
    const dataCtx = getDataCtx();
    const dataCanvas = dataCanvasRef.current;
    if (dataCtx && dataCanvas) {
        const imageData = dataCtx.getImageData(0, 0, dataCanvas.width, dataCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        dataCtx.putImageData(imageData, 0, 0);
        syncDisplayCanvas();
        saveToHistory();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const displayCtx = getDisplayCtx();
    const dataCtx = getDataCtx();
    const dataCanvas = dataCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    if (displayCtx && dataCtx && dataCanvas && displayCanvas) {
      setIsDrawing(true);

      const scale = dataCanvas.width / displayCanvas.width;

      displayCtx.beginPath();
      displayCtx.moveTo(coords.x, coords.y);

      dataCtx.beginPath();
      dataCtx.moveTo(coords.x * scale, coords.y * scale);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const displayCtx = getDisplayCtx();
    const dataCtx = getDataCtx();
    const dataCanvas = dataCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    if (displayCtx && dataCtx && dataCanvas && displayCanvas) {
        const scale = dataCanvas.width / displayCanvas.width;

        const style = tool === 'brush' ? 'white' : 'black';

        // Draw on display canvas (for immediate feedback)
        displayCtx.lineWidth = brushSize;
        displayCtx.lineCap = 'round';
        displayCtx.strokeStyle = style;
        displayCtx.shadowBlur = softEdge ? brushSize / 2 : 0;
        displayCtx.shadowColor = style;
        displayCtx.lineTo(coords.x, coords.y);
        displayCtx.stroke();

        // Draw on data canvas (for saving)
        dataCtx.lineWidth = brushSize * scale;
        dataCtx.lineCap = 'round';
        dataCtx.strokeStyle = style;
        dataCtx.shadowBlur = softEdge ? (brushSize * scale) / 2 : 0;
        dataCtx.shadowColor = style;
        dataCtx.lineTo(coords.x * scale, coords.y * scale);
        dataCtx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const displayCtx = getDisplayCtx();
    const dataCtx = getDataCtx();

    if (displayCtx) displayCtx.closePath();
    if (dataCtx) dataCtx.closePath();

    if (isDrawing) {
        saveToHistory();
    }
    setIsDrawing(false);
  };

  const handleSave = () => {
    const dataCanvas = dataCanvasRef.current;
    if (dataCanvas) {
      onSave(dataCanvas.toDataURL('image/png'));
    }
  };

  // This effect observes the VISIBLE image element and resizes the display canvas to match it perfectly.
  useLayoutEffect(() => {
    const image = visibleImageRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!image || !displayCanvas) return;

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Check to prevent potential infinite loops if observer fires rapidly
        if (displayCanvas.width !== width || displayCanvas.height !== height) {
            displayCanvas.width = width;
            displayCanvas.height = height;
            syncDisplayCanvas();
        }
      }
    });

    observer.observe(image);
    return () => observer.disconnect();
  }, [syncDisplayCanvas]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const { undo, redo, onClose } = callbacksRef.current;
        if (e.key === 'Escape') onClose();
        if (e.metaKey || e.ctrlKey) {
            if (e.key === 'z') { e.preventDefault(); undo(); }
            if (e.key === 'y' || (e.shiftKey && e.key === 'z')) { e.preventDefault(); redo(); }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array ensures this effect runs only once.


  return (
    <div role="dialog" aria-modal="true" aria-label="Masking Editor" className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
        {/* Hidden high-res data canvas */}
        <canvas ref={dataCanvasRef} className="hidden" />

        {/* Hidden image to get natural dimensions on load */}
        <img ref={imageRef} src={imageUrl} onLoad={initializeCanvases} className="hidden" alt="Source for masking"/>

        <div className="absolute top-4 right-4 flex items-center gap-4">
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors">Save Mask</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close editor">
                <XMarkIcon className="w-8 h-8"/>
            </button>
        </div>

        <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img ref={visibleImageRef} src={imageUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none" alt="Design to edit" />
            <canvas
                ref={displayCanvasRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-crosshair mix-blend-screen opacity-70"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>

        <div className="absolute bottom-4 flex flex-wrap items-center justify-center gap-6 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
            {/* Tools */}
            <div className="flex items-center gap-2">
                <button onClick={() => setTool('brush')} className={`p-2 rounded-md ${tool === 'brush' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} aria-label="Brush tool"><PaintBrushIcon className="w-6 h-6"/></button>
                <button onClick={() => setTool('eraser')} className={`p-2 rounded-md ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} aria-label="Eraser tool"><EraserIcon className="w-6 h-6"/></button>
                <button onClick={invertMask} className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600" aria-label="Invert mask"><ArrowPathIcon className="w-6 h-6"/></button>
            </div>

            {/* Brush Options */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {[10, 20, 40].map(size => (
                        <button key={size} onClick={() => setBrushSize(size)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${brushSize === size ? 'bg-indigo-600 ring-2 ring-white' : 'bg-slate-700 hover:bg-slate-600'}`} aria-label={`Set brush size to ${size}`}>
                            <div className="bg-white rounded-full" style={{ width: `${size/2.5}px`, height: `${size/2.5}px` }}></div>
                        </button>
                    ))}
                </div>
                <div className="flex items-center">
                    <button onClick={() => setSoftEdge(p => !p)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${softEdge ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        Soft Edge
                    </button>
                </div>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-2">
                <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo"><ArrowUturnLeftIcon className="w-6 h-6"/></button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Redo"><ArrowUturnRightIcon className="w-6 h-6"/></button>
            </div>
        </div>
    </div>
  );
};
