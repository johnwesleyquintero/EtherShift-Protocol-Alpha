import React from 'react';
import { PlayerStats } from '../../types';
import { Activity, Zap, Database } from 'lucide-react';

export const StatusPanel: React.FC<{ stats: PlayerStats; isShiftActive: boolean }> = ({ stats, isShiftActive }) => {
  
  const getBarWidth = (current: number, max: number) => `${(current / max) * 100}%`;

  return (
    <div className={`
        p-4 rounded-lg border-2 mb-4 transition-colors duration-500
        ${isShiftActive ? 'bg-slate-900/80 border-cyan-500/50' : 'bg-slate-900 border-slate-700'}
    `}>
      <div className="flex justify-between items-end mb-2">
        <h2 className={`font-bold uppercase tracking-widest ${isShiftActive ? 'text-cyan-400' : 'text-slate-200'}`}>
            Operator Status
        </h2>
        <span className="text-xs text-slate-500 font-mono">LVL {stats.level} // XP: {stats.xp}</span>
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 text-red-400"><Activity size={16} /></div>
        <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden border border-slate-700">
            <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" 
                style={{ width: getBarWidth(stats.hp, stats.maxHp) }} 
            />
        </div>
        <span className="text-xs font-mono w-12 text-right text-red-300">{stats.hp}/{stats.maxHp}</span>
      </div>

      {/* MP (Ether) Bar */}
      <div className="flex items-center gap-3">
        <div className={`w-6 ${isShiftActive ? 'text-cyan-300' : 'text-amber-400'}`}>
            {isShiftActive ? <Zap size={16} /> : <Database size={16} />}
        </div>
        <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden border border-slate-700">
            <div 
                className={`h-full transition-all duration-300 ${isShiftActive ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 animate-pulse' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`} 
                style={{ width: getBarWidth(stats.mp, stats.maxMp) }} 
            />
        </div>
        <span className="text-xs font-mono w-12 text-right text-amber-300">{stats.mp}/{stats.maxMp}</span>
      </div>
    </div>
  );
};
