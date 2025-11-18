import React from 'react';
import { GameState, Tile, TileType, InteractableType, Direction } from '../types';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants';
import { User, Box, Droplets, BrickWall, Ghost, Sparkles } from 'lucide-react';

interface WorldGridProps {
  tiles: Tile[];
  gameState: GameState;
}

export const WorldGrid: React.FC<WorldGridProps> = ({ tiles, gameState }) => {
  
  // Calculate grid styling
  const gridStyle = {
    gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${GRID_HEIGHT}, minmax(0, 1fr))`,
  };

  return (
    <div className="relative bg-slate-900 border-2 border-slate-700 rounded-lg p-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      
      {/* The Grid Container */}
      <div className="grid gap-0.5 w-full h-full aspect-[12/10]" style={gridStyle}>
        {tiles.map((tile) => {
          const isPlayerHere = tile.x === gameState.playerPos.x && tile.y === gameState.playerPos.y;
          
          // Visual Logic
          let bgClass = "bg-slate-800";
          let Icon = null;
          let iconColor = "text-slate-600";

          // Terrain Rendering
          if (tile.type === TileType.WALL) {
            bgClass = gameState.isShiftActive ? "bg-slate-900 border border-cyan-900/30" : "bg-slate-700";
            Icon = BrickWall;
          } else if (tile.type === TileType.WATER) {
            bgClass = "bg-blue-950/50 animate-pulse-slow";
            Icon = Droplets;
            iconColor = "text-blue-500";
          }

          // Interaction Rendering
          if (tile.interactable) {
            // Hide if hidden and Shift not active
            if (!tile.interactable.isHidden || gameState.isShiftActive) {
                if (tile.interactable.type === InteractableType.NPC) {
                    Icon = Ghost;
                    iconColor = "text-amber-400";
                } else if (tile.interactable.type === InteractableType.ITEM) {
                    Icon = Box;
                    iconColor = gameState.isShiftActive ? "text-cyan-400 animate-bounce" : "text-emerald-500";
                }
            }
          }

          // Shift Effect on Grid
          if (gameState.isShiftActive) {
            if (tile.type === TileType.EMPTY) bgClass = "bg-slate-900";
          }

          return (
            <div 
              key={tile.id}
              className={`
                relative flex items-center justify-center 
                ${bgClass} 
                ${gameState.isShiftActive ? 'border border-cyan-500/10' : ''}
                transition-colors duration-300
              `}
            >
                {/* Render Terrain/Entity Icon */}
                {Icon && !isPlayerHere && (
                    <Icon size={20} className={`${iconColor} ${tile.interactable?.isHidden ? 'opacity-70' : 'opacity-100'}`} />
                )}

                {/* Render Player */}
                {isPlayerHere && (
                    <div className={`
                        z-10 relative transition-transform duration-150
                        ${gameState.playerFacing === Direction.LEFT ? '-scale-x-100' : ''}
                    `}>
                        <User 
                            size={24} 
                            className={`
                                ${gameState.isShiftActive ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-white'}
                            `} 
                        />
                        {/* Player Aura in Shift Mode */}
                        {gameState.isShiftActive && (
                            <div className="absolute inset-0 bg-cyan-400/30 blur-md rounded-full animate-pulse"></div>
                        )}
                    </div>
                )}

                {/* Coordinate Debug (Optional, for Architect) */}
                {/* <span className="absolute bottom-0 right-0 text-[8px] text-slate-600">{tile.x},{tile.y}</span> */}
            </div>
          );
        })}
      </div>

      {/* Shift Mode Overlay Effect */}
      {gameState.isShiftActive && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-900/10 to-transparent z-20 mix-blend-overlay"></div>
      )}
    </div>
  );
};
