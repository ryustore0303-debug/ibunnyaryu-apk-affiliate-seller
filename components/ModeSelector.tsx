import React from 'react';
import { Hand, Package, User } from 'lucide-react';
import { AppMode } from '../types';
import { MODES } from '../constants';

interface ModeSelectorProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const getIcon = (iconName: string, active: boolean) => {
    const className = `mb-2 w-5 h-5 ${active ? 'text-pink-400' : 'text-gray-400 group-hover:text-pink-300'}`;
    switch (iconName) {
      case 'hand': return <Hand className={className} />;
      case 'package': return <Package className={className} />;
      case 'user': return <User className={className} />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {MODES.map((mode) => {
        const active = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`
              group p-3 rounded-xl border text-left transition-all duration-300
              ${active 
                ? 'bg-white/10 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
                : 'bg-transparent border-white/10 hover:bg-white/5'}
            `}
          >
            {getIcon(mode.icon, active)}
            <div className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-400'}`}>
              {mode.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;