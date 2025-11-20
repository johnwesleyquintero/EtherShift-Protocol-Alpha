
import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle, Zap } from 'lucide-react';
import { Direction } from '../../types';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onInteract: () => void;
  onShift: () => void;
  onCombatInput?: (dir: Direction) => void;
  isCombatActive: boolean;
  isShiftActive: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ 
    onMove, onInteract, onShift, onCombatInput, isCombatActive, isShiftActive 
}) => {

  const handleDir = (dx: number, dy: number, dir: Direction) => {
      if (isCombatActive && onCombatInput) {
          onCombatInput(dir);
      } else {
          onMove(dx, dy);
      }
  };

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 px-4 pb-2 flex items-end justify-between z-50 select-none touch-none pointer-events-none">
        
        {/* D-PAD */}
        <div className="pointer-events-auto relative w-36 h-36 bg-slate-900/80 backdrop-blur rounded-full border-2 border-slate-700 shadow-lg">
            <button 
                className="absolute top-1 left-1/2 -translate-x-1/2 p-3 text-slate-400 active:text-cyan-400 active:scale-90 transition-transform"
                onClick={() => handleDir(0, -1, Direction.UP)}
            >
                <ArrowUp size={32} />
            </button>
            <button 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 p-3 text-slate-400 active:text-cyan-400 active:scale-90 transition-transform"
                onClick={() => handleDir(0, 1, Direction.DOWN)}
            >
                <ArrowDown size={32} />
            </button>
            <button 
                className="absolute left-1 top-1/2 -translate-y-1/2 p-3 text-slate-400 active:text-cyan-400 active:scale-90 transition-transform"
                onClick={() => handleDir(-1, 0, Direction.LEFT)}
            >
                <ArrowLeft size={32} />
            </button>
            <button 
                className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-slate-400 active:text-cyan-400 active:scale-90 transition-transform"
                onClick={() => handleDir(1, 0, Direction.RIGHT)}
            >
                <ArrowRight size={32} />
            </button>
            
            {/* Center Nub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border border-slate-600"></div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pointer-events-auto flex gap-4 items-end">
             {/* Shift Button */}
            <button 
                onClick={onShift}
                className={`
                    w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg active:scale-95 transition-all
                    ${isShiftActive 
                        ? 'bg-cyan-900/80 border-cyan-400 text-cyan-400' 
                        : 'bg-slate-900/80 border-slate-600 text-slate-500'
                    }
                `}
            >
                <Zap size={24} className={isShiftActive ? 'fill-cyan-400' : ''} />
            </button>
            
            {/* Interact / Confirm Button */}
            <button 
                onClick={onInteract}
                className="w-20 h-20 rounded-full bg-emerald-900/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg active:scale-95 transition-all mb-2"
            >
                <Circle size={32} strokeWidth={3} />
            </button>
        </div>

    </div>
  );
};
