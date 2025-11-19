
import React from 'react';
import { ActiveEnemy, PlayerStats, CombatState, Direction } from '../types';
import { PLAYER_SKILLS } from '../constants';
import { Bug, User, Sword, Zap, Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Clock } from 'lucide-react';

interface CombatArenaProps {
    enemy: ActiveEnemy;
    playerStats: PlayerStats;
    combatState: CombatState;
    onAction: (action: 'ATTACK' | 'FLEE' | 'OPEN_SKILLS' | 'CANCEL_SKILL' | 'SELECT_SKILL', data?: any) => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({ enemy, playerStats, combatState, onAction }) => {

  const getHealthColor = (current: number, max: number) => {
    const percentage = current / max;
    if (percentage > 0.6) return 'bg-emerald-500';
    if (percentage > 0.3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderArrow = (dir: Direction, status: 'PENDING' | 'ACTIVE' | 'SUCCESS' | 'FAIL') => {
      let color = "text-slate-700";
      if (status === 'ACTIVE') color = "text-slate-200";
      if (status === 'SUCCESS') color = "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]";
      if (status === 'FAIL') color = "text-red-500";

      const size = 32;

      switch (dir) {
          case Direction.UP: return <ArrowUp size={size} className={color} />;
          case Direction.DOWN: return <ArrowDown size={size} className={color} />;
          case Direction.LEFT: return <ArrowLeft size={size} className={color} />;
          case Direction.RIGHT: return <ArrowRight size={size} className={color} />;
          default: return null;
      }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-slate-950 border-2 border-red-900/50 rounded-lg p-4 shadow-[inset_0_0_50px_rgba(127,29,29,0.3)] relative overflow-hidden">
      
      {/* Background Glitch Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_11px)]"></div>

      {/* Top: Enemy Status */}
      <div className="w-full max-w-md flex flex-col items-center animate-in slide-in-from-top-10 duration-700 relative z-10">
        <div className="relative mb-4">
            <div className={`absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse transition-all duration-300 ${combatState.lastInputResult === 'FAIL' ? 'bg-red-600 opacity-50' : ''}`}></div>
            <Bug size={64} className={`text-red-500 relative z-10 ${combatState.lastInputResult === 'SUCCESS' ? 'animate-bounce' : ''}`} />
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

      {/* Center: Dynamic State */}
      <div className="flex-1 flex items-center justify-center w-full relative z-10">
          {combatState.phase === 'INPUT' && combatState.selectedSkillId ? (
               <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-200">
                   <div className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">
                        Input Sequence
                   </div>
                   <div className="flex gap-4 p-4 bg-slate-900/80 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
                       {PLAYER_SKILLS[Object.keys(PLAYER_SKILLS).find(key => PLAYER_SKILLS[key].id === combatState.selectedSkillId)!].sequence.map((dir, idx) => {
                           let status: 'PENDING' | 'ACTIVE' | 'SUCCESS' | 'FAIL' = 'PENDING';
                           if (idx < combatState.inputBuffer.length) {
                               // This index has been entered
                               status = 'SUCCESS'; 
                           } else if (idx === combatState.inputBuffer.length) {
                               status = 'ACTIVE';
                           }
                           
                           if (combatState.lastInputResult === 'FAIL') status = 'FAIL';

                           return (
                               <div key={idx} className="transition-all duration-200">
                                   {renderArrow(dir, status)}
                               </div>
                           );
                       })}
                   </div>
                   <div className="text-xs text-slate-500 font-mono">
                       [USE ARROW KEYS OR WASD]
                   </div>
               </div>
          ) : combatState.phase === 'WAITING' ? (
               <div className="flex flex-col items-center gap-2 text-red-400 animate-pulse">
                   <Clock size={48} />
                   <span className="text-xs font-bold tracking-widest">ENEMY TURN...</span>
               </div>
          ) : (
            <div className="text-4xl font-black text-slate-800 italic select-none opacity-50 animate-pulse">VS</div>
          )}
      </div>

      {/* Bottom: Player Controls */}
      <div className="w-full max-w-md z-20 relative">
        
        {/* Player Icon (Only show in MENU phase to save space?) Keep it for grounding. */}
        {combatState.phase === 'MENU' && (
             <div className="flex justify-center mb-6">
                <div className="relative">
                    <User size={48} className="text-cyan-400" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500/50 blur-sm rounded-full"></div>
                </div>
            </div>
        )}

        {/* MENU PHASE */}
        {combatState.phase === 'MENU' && (
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => onAction('ATTACK')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-red-400 hover:text-red-400 transition-all group rounded"
                >
                    <Sword size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold tracking-wider">ATTACK</span>
                </button>

                <button 
                    onClick={() => onAction('OPEN_SKILLS')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-cyan-400 hover:text-cyan-400 transition-all group rounded"
                >
                    <Zap size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold tracking-wider">RUNES</span>
                </button>

                <button 
                    onClick={() => onAction('FLEE')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-emerald-400 hover:text-emerald-400 transition-all group rounded"
                >
                    <Wind size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold tracking-wider">FLEE</span>
                </button>
            </div>
        )}

        {/* SKILL SELECTION PHASE */}
        {combatState.phase === 'SKILL_SELECT' && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 font-bold text-xs tracking-widest">SELECT PROTOCOL</span>
                    <button onClick={() => onAction('CANCEL_SKILL')} className="text-slate-500 hover:text-white">
                        <CornerDownLeft size={16} />
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                    {Object.values(PLAYER_SKILLS).map(skill => {
                        const canAfford = playerStats.mp >= skill.mpCost;
                        return (
                            <button
                                key={skill.id}
                                disabled={!canAfford}
                                onClick={() => onAction('SELECT_SKILL', skill.id)}
                                className={`
                                    flex items-center justify-between p-3 rounded border text-left
                                    ${canAfford 
                                        ? 'bg-slate-900 border-slate-700 hover:border-cyan-400 group' 
                                        : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div>
                                    <div className={`font-bold text-sm ${canAfford ? 'text-slate-200 group-hover:text-cyan-400' : 'text-slate-600'}`}>{skill.name}</div>
                                    <div className="text-[10px] text-slate-500">{skill.description}</div>
                                </div>
                                <div className="text-xs font-mono text-cyan-600 font-bold">
                                    {skill.mpCost} MP
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        )}

        {/* INPUT PHASE (Cancel button only) */}
        {combatState.phase === 'INPUT' && (
             <div className="flex justify-center mt-4">
                  <button onClick={() => onAction('CANCEL_SKILL')} className="text-xs text-red-500 hover:underline">
                        ABORT SEQUENCE [ESC]
                  </button>
             </div>
        )}
      </div>

    </div>
  );
};