
import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { WorldGrid } from './components/WorldGrid';
import { CombatArena } from './components/CombatArena';
import { StatusPanel } from './components/HUD/StatusPanel';
import { LogConsole } from './components/HUD/LogConsole';
import { Keyboard, Monitor, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const { tiles, gameState, actions } = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-cyan-900 selection:text-white flex items-center justify-center p-4 lg:p-8 overflow-hidden relative">
      
      {/* CRT Overlay Effects */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      <div className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
      {gameState.isShiftActive && !gameState.isCombatActive && (
         <div className="pointer-events-none fixed inset-0 z-30 bg-cyan-500/5 animate-pulse"></div>
      )}
      {gameState.isCombatActive && (
         <div className="pointer-events-none fixed inset-0 z-30 bg-red-900/10 animate-pulse"></div>
      )}

      {/* Main Game Container */}
      <main className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Header / Title Mobile */}
        <div className="lg:hidden col-span-1 mb-2">
             <h1 className="text-2xl font-bold text-cyan-500 tracking-tighter">ETHER<span className="text-slate-100">SHIFT</span></h1>
             <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-transparent mt-1"></div>
        </div>

        {/* Left Column: Game Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-[500px] lg:h-auto">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Monitor size={14} />
                    <span>SYS.VISUAL_FEED</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className={`${gameState.isCombatActive ? 'text-red-500 font-bold animate-pulse' : ''}`}>
                        STATUS: {gameState.isCombatActive ? '⚠️ COMBAT ENGAGED' : 'NORMAL'}
                    </span>
                </div>
            </div>
            
            {/* The Main View: Switches between Map and Combat */}
            <div className="flex-1 relative">
                {gameState.isCombatActive ? (
                    <CombatArena 
                        enemy={gameState.activeEnemy} 
                        playerStats={gameState.stats}
                        onAction={actions.handleCombatAction}
                    />
                ) : (
                    <WorldGrid tiles={tiles} gameState={gameState} />
                )}
            </div>
            
            {/* Instructions */}
            <div className="hidden lg:flex justify-between text-xs text-slate-500 px-2 border-t border-slate-800 pt-2">
                {!gameState.isCombatActive ? (
                    <>
                        <span className="flex items-center gap-1"><Keyboard size={12} /> WASD: Move</span>
                        <span className="flex items-center gap-1"><Cpu size={12} /> SPACE: Ether Shift</span>
                        <span>E / ENTER: Interact</span>
                    </>
                ) : (
                     <span className="text-red-400">COMBAT PROTOCOLS ACTIVE. SELECT ACTION.</span>
                )}
            </div>
        </div>

        {/* Right Column: HUD & Logs */}
        <div className="lg:col-span-4 flex flex-col h-full">
            <div className="hidden lg:block mb-6">
                <h1 className="text-4xl font-bold text-cyan-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    ETHER<span className="text-slate-100">SHIFT</span>
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Protocol Alpha // v2.3</p>
            </div>

            <StatusPanel stats={gameState.stats} isShiftActive={gameState.isShiftActive} />

            <div className="flex-1 min-h-[200px] flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 uppercase">
                    <div className={`w-2 h-2 rounded-full ${gameState.isShiftActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                    System Log
                </div>
                <LogConsole logs={gameState.gameLog} />
            </div>

            {/* Inventory Summary (Simple List for Proto) */}
            <div className="mt-4 bg-slate-900/50 border border-slate-800 rounded p-3">
                <h3 className="text-xs text-slate-400 uppercase mb-2 border-b border-slate-800 pb-1">Inventory Storage</h3>
                <div className="flex flex-wrap gap-2">
                    {gameState.inventory.length === 0 ? (
                        <span className="text-slate-700 text-xs">Empty...</span>
                    ) : (
                        gameState.inventory.map((item, idx) => (
                            <div key={idx} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">
                                {item.name}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mobile Controls Hint */}
            <div className="lg:hidden mt-4 text-center text-xs text-slate-500">
                Use Keyboard or External Input Device. Touch controls offline.
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;
