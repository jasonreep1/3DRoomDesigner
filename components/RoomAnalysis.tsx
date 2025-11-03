import React, { useState, useEffect } from 'react';
import { AppProvider } from '../state/AppContext';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon, ChevronDownIcon } from './icons';

export const RoomAnalysis: React.FC = () => {
    const { state } = React.useContext(AppProvider);
    const { status, roomAnalysis, analysisError, originalImageData, history } = state;
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (history.length > 0) {
            setIsCollapsed(true);
        }
    }, [history.length]);

    if (!originalImageData) return null;

    const isLoading = status === 'analyzing';
    const description = roomAnalysis?.description ?? null;
    const materials = roomAnalysis?.materials ?? [];

    if (isLoading) {
        return (
            <div className="border-t border-slate-700 pt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
                    Analyzing room details...
                </div>
            </div>
        );
    }

    if (analysisError) {
        return (
            <div className="border-t border-slate-700 pt-6">
                <div role="alert" className="flex items-center gap-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm"><strong>Analysis Error:</strong> {analysisError}</p>
                </div>
            </div>
        );
    }

    if (!description && materials.length === 0) {
        return null;
    }

    return (
        <div className="border-t border-slate-700 pt-6">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={!isCollapsed}
            >
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="w-5 h-5 text-indigo-400" />
                    AI Room Analysis
                </h3>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 mt-0' : 'max-h-96 mt-4'}`}>
                <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 space-y-4">
                    {description && (
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">Description</h4>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                    )}
                    {materials.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-2">Identified Materials</h4>
                        <div className="flex flex-wrap gap-2">
                        {materials.map((material, index) => (
                            <span key={index} className="px-2.5 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/50 rounded-full border border-cyan-800">
                            {material}
                            </span>
                        ))}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};
