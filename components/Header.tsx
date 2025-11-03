import React from 'react';
import { AppProvider } from '../state/AppContext';
import { CubeIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, SparklesIcon } from './icons';

interface HeaderProps {
    onLoadProjectClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoadProjectClick }) => {
  const { state, dispatch } = React.useContext(AppProvider);
  const { isAdvancedMode, originalImageData, history } = state;

  const handleSaveProject = () => {
    if (!originalImageData || history.length === 0) {
        alert("There is no project to save.");
        return;
    }
    const projectData = {
        originalImageData,
        history,
        version: 1,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `room_design_project.roomdesigner`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="relative">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <button
            onClick={() => dispatch({ type: 'TOGGLE_ADVANCED_MODE' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${isAdvancedMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            aria-label="Toggle Advanced AI Mode"
            title={isAdvancedMode ? "Disable advanced mode (faster, standard suggestions)" : "Enable advanced mode (slower, higher quality suggestions)"}
        >
            <SparklesIcon className="w-4 h-4" />
            {isAdvancedMode ? 'Advanced ON' : 'Advanced OFF'}
        </button>
        <button
            onClick={handleSaveProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
            aria-label="Save current project"
        >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Save
        </button>
        <button
            onClick={onLoadProjectClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
            aria-label="Load a project file"
        >
            <DocumentArrowUpIcon className="w-4 h-4" />
            Load
        </button>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
            <CubeIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text">
            3D Room Designer AI
            </h1>
        </div>
        <p className="mt-2 text-md sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Transform a photo of any room into a stunning, fully-realized design concept in seconds.
        </p>
      </div>
    </header>
  );
};
