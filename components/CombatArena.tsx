
import React from 'react';
import { ActiveEnemy, PlayerStats } from '../types';
import { Bug, User, Sword, Zap, Wind } from 'lucide-react';

interface CombatArenaProps {
  enemy: ActiveEnemy | null;
  playerStats: PlayerStats;
  onAction: (action: 'ATTACK' | 'SKILL' | 'FLEE') => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({ enemy, playerStats, onAction }) => {
  if (!enemy) return <div className="text-red-500">ERROR: No Target</div>;

  const getHealthColor = (current: number, max: number) => {
    const percentage = current / max;
    if (percentage > 0.6) return 'bg-emerald-500';
    if (percentage > 0.3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-slate-950 border-2 border-red-900/50 rounded-lg p-4 shadow-[inset_0_0_50px_rgba(127,29,29,0.3)] relative overflow-hidden">
      
      {/* Background Glitch Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_11px)]"></div>

      {/* Top: Enemy Status */}
      <div className="w-full max-w-md flex flex-col items-center animate-in slide-in-from-top-10 duration-700">
        <div className="relative mb-4">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
            <Bug size={64} className="text-red-500 relative z-10 animate-bounce" />
        </div>
        <h2 className="text-red-400 font-bold tracking-widest text-xl">{enemy.name}</h2>
        <div className="w-full h-4 bg-slate-900 border border-slate-700 rounded-full mt-2 overflow-hidden">
            <div 
                className={`h-full transition-all duration-500 ${getHealthColor(enemy.hp, enemy.maxHp)}`}
                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            ></div>
        </div>
        <span className="text-xs text-slate-500 mt-1 font-mono">HP: {enemy.hp}/{enemy.maxHp}</span>
      </div>

      {/* Center: VS */}
      <div className="text-4xl font-black text-slate-800 italic select-none opacity-50">VS</div>

      {/* Bottom: Player Controls */}
      <div className="w-full max-w-md z-20">
        <div className="flex justify-center mb-6">
             <div className="relative">
                <User size={48} className="text-cyan-400" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500/50 blur-sm rounded-full"></div>
             </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            <button 
                onClick={() => onAction('ATTACK')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-red-400 hover:text-red-400 transition-all group rounded"
            >
                <Sword size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wider">ATTACK</span>
            </button>

            <button 
                onClick={() => onAction('SKILL')}
                disabled={playerStats.mp < 10}
                className={`
                    flex flex-col items-center justify-center p-4 border transition-all group rounded
                    ${playerStats.mp < 10 
                        ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-cyan-400 hover:text-cyan-400'
                    }
                `}
            >
                <Zap size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wider">SKILL (10 MP)</span>
            </button>

            <button 
                onClick={() => onAction('FLEE')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-emerald-400 hover:text-emerald-400 transition-all group rounded"
            >
                <Wind size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wider">FLEE</span>
            </button>
        </div>
      </div>

    </div>
  );
};
