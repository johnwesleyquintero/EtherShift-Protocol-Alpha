
import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { WorldGrid } from './components/WorldGrid';
import { CombatArena } from './components/CombatArena';
import { StatusPanel } from './components/HUD/StatusPanel';
import { LogConsole } from './components/HUD/LogConsole';
import { DialogueOverlay } from './components/HUD/DialogueOverlay';
import { Keyboard, Monitor, Cpu, Globe, Skull, RotateCcw, Trash2, MousePointerClick } from 'lucide-react';

const App: React.FC = () => {
  const { tiles, gameState, actions } = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-cyan-900 selection:text-white flex items-center justify-center p-4 lg:p-8 overflow-hidden relative">
      
      {/* CRT Overlay Effects */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      <div className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
      {gameState.isShiftActive && !gameState.isCombatActive && !gameState.isTransitioning && !gameState.isDialogueActive && (
         <div className="pointer-events-none fixed inset-0 z-30 bg-cyan-500/5 animate-pulse"></div>
      )}
      {gameState.isCombatActive && !gameState.isGameOver && (
         <div className="pointer-events-none fixed inset-0 z-30 bg-red-900/10 animate-pulse"></div>
      )}

      {/* Zone Transition Overlay */}
      {gameState.isTransitioning && (
        <div className="absolute inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-full h-1 bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-scanline absolute top-0"></div>
            <Globe size={64} className="text-cyan-400 animate-spin-slow" />
            <h2 className="text-2xl font-bold text-cyan-400 tracking-widest animate-pulse">MIGRATING HOST...</h2>
            <div className="font-mono text-xs text-slate-500">
                ESTABLISHING HANDSHAKE // {gameState.currentZoneId.toUpperCase()}
            </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 z-[70] bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-8 animate-in zoom-in duration-500">
             <Skull size={80} className="text-red-500 animate-bounce" />
             <div className="text-center space-y-2">
                 <h1 className="text-4xl md:text-6xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                     CRITICAL FAILURE
                 </h1>
                 <p className="text-red-300 font-mono tracking-widest">SYSTEM INTEGRITY COMPROMISED</p>
             </div>
             
             <div className="flex gap-4 mt-4">
                 <button 
                    onClick={actions.system.loadGame}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-red-500 text-red-400 hover:bg-red-900 hover:text-white transition-all rounded uppercase font-bold tracking-wider"
                 >
                     <RotateCcw size={18} />
                     Reboot System
                 </button>
                 <button 
                    onClick={actions.system.resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-600 text-slate-400 hover:bg-slate-800 hover:border-slate-400 transition-all rounded uppercase font-bold tracking-wider"
                 >
                     <Trash2 size={18} />
                     Format Drive
                 </button>
             </div>
        </div>
      )}

      {/* Narrative Overlay */}
      {gameState.isDialogueActive && gameState.activeDialogue && (
        <DialogueOverlay 
          activeDialogue={gameState.activeDialogue} 
          onSelectOption={actions.selectDialogueOption} 
        />
      )}

      {/* Main Game Container */}
      <main className={`relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 ${gameState.isGameOver ? 'blur-sm grayscale opacity-50 pointer-events-none' : ''}`}>
        
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
                    <span className="text-cyan-600 mr-2">[{gameState.currentZoneName.toUpperCase()}]</span>
                    <span className={`${gameState.isCombatActive ? 'text-red-500 font-bold animate-pulse' : ''}`}>
                        STATUS: {gameState.isCombatActive ? '⚠️ COMBAT ENGAGED' : (gameState.isDialogueActive ? '🔵 DATA TRANSFER' : 'NORMAL')}
                    </span>
                </div>
            </div>
            
            {/* The Main View: Switches between Map and Combat */}
            <div className="flex-1 relative">
                {gameState.isCombatActive && gameState.activeEnemy ? (
                    <CombatArena 
                        enemy={gameState.activeEnemy} 
                        playerStats={gameState.stats}
                        combatState={gameState.combatState}
                        onAction={actions.handleCombatUI}
                    />
                ) : (
                    <WorldGrid tiles={tiles} gameState={gameState} />
                )}
            </div>
            
            {/* Instructions */}
            <div className="hidden lg:flex justify-between text-xs text-slate-500 px-2 border-t border-slate-800 pt-2">
                {!gameState.isCombatActive && !gameState.isDialogueActive ? (
                    <>
                        <span className="flex items-center gap-1"><Keyboard size={12} /> WASD: Move</span>
                        <span className="flex items-center gap-1"><Cpu size={12} /> SPACE: Ether Shift</span>
                        <span>E / ENTER: Interact</span>
                    </>
                ) : gameState.isDialogueActive ? (
                    <span className="text-cyan-400">INCOMING TRANSMISSION. SELECT RESPONSE.</span>
                ) : (
                     <span className="text-red-400">COMBAT PROTOCOLS ACTIVE. EXECUTE RUNES.</span>
                )}
            </div>
        </div>

        {/* Right Column: HUD & Logs */}
        <div className="lg:col-span-4 flex flex-col h-full">
            <div className="hidden lg:block mb-6">
                <h1 className="text-4xl font-bold text-cyan-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    ETHER<span className="text-slate-100">SHIFT</span>
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Protocol Alpha // v2.4</p>
            </div>

            <StatusPanel 
                stats={gameState.stats} 
                isShiftActive={gameState.isShiftActive} 
                systemActions={actions.system} 
            />

            <div className="flex-1 min-h-[200px] flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 uppercase">
                    <div className={`w-2 h-2 rounded-full ${gameState.isShiftActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                    System Log
                </div>
                <LogConsole logs={gameState.gameLog} />
            </div>

            {/* Inventory Summary */}
            <div className="mt-4 bg-slate-900/50 border border-slate-800 rounded p-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-2">
                    <h3 className="text-xs text-slate-400 uppercase">Inventory Storage</h3>
                    <MousePointerClick size={12} className="text-slate-600" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {gameState.inventory.length === 0 ? (
                        <span className="text-slate-700 text-xs">Empty...</span>
                    ) : (
                        gameState.inventory.map((item, idx) => {
                            const isConsumable = item.type === 'CONSUMABLE';
                            const isBusy = gameState.isTransitioning || (gameState.isCombatActive && gameState.combatState.phase === 'WAITING');
                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => isConsumable && actions.consumeItem(item)}
                                    disabled={!isConsumable || isBusy}
                                    className={`
                                        px-2 py-1 rounded text-xs border transition-all flex items-center gap-1
                                        ${isConsumable 
                                            ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-800 hover:border-emerald-500 cursor-pointer' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 cursor-default'
                                        }
                                        ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    title={isConsumable ? "Click to Consume" : item.description}
                                >
                                    {item.name}
                                    {isConsumable && <span className="text-[10px] opacity-50 ml-1">(USE)</span>}
                                </button>
                            )
                        })
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