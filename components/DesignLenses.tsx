import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface DesignLensesProps {
  onApplyLens: (prompt: string) => void;
}

const lenses = [
  { name: 'Brighter Daylight', icon: SunIcon, prompt: 'Make the lighting brighter and more like natural daylight.' },
  { name: 'Warm Evening Light', icon: MoonIcon, prompt: 'Change the lighting to a warm, cozy evening ambiance with soft, artificial lights.' },
];

export const DesignLenses: React.FC<DesignLensesProps> = ({ onApplyLens }) => {
  return (
    <div className="border-t border-slate-700 pt-4">
      <h4 className="text-sm font-medium text-slate-300 mb-2">Design Lenses</h4>
      <div className="flex items-center gap-2">
        {lenses.map(lens => (
          <button
            key={lens.name}
            onClick={() => onApplyLens(lens.prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200"
            title={lens.prompt}
          >
            <lens.icon className="w-4 h-4" />
            {lens.name}
          </button>
        ))}
      </div>
    </div>
  );
};
