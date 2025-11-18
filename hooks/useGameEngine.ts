import { useState, useEffect, useCallback } from 'react';
import { GameState, Direction, Position, LogEntry, Tile, InteractableType, TileType } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_LOG_MESSAGE, generateZone } from '../constants';

export const useGameEngine = () => {
  // --- State Initialization ---
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 2, y: 5 },
    playerFacing: Direction.DOWN,
    stats: {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      level: 1,
      xp: 0,
    },
    inventory: [],
    currentZone: 'Sector-01: Awakening',
    isShiftActive: false,
    gameLog: [],
    isCombatActive: false,
  });

  // --- Helpers ---
  
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'INFO') => {
    setGameState(prev => ({
      ...prev,
      gameLog: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
          message,
          type
        },
        ...prev.gameLog.slice(0, 49) // Keep last 50
      ]
    }));
  }, []);

  // --- Initialization Effect ---
  useEffect(() => {
    const initialTiles = generateZone(GRID_WIDTH, GRID_HEIGHT);
    setTiles(initialTiles);
    addLog(INITIAL_LOG_MESSAGE, 'SYSTEM');
  }, [addLog]);

  // --- Actions ---

  const toggleShift = useCallback(() => {
    setGameState(prev => {
      const newState = !prev.isShiftActive;
      addLog(newState ? ">> ETHER SHIFT ACTIVATED <<" : "Shift disengaged. Reality stabilized.", 'SYSTEM');
      return { ...prev, isShiftActive: newState };
    });
  }, [addLog]);

  const handleInteraction = useCallback(() => {
    const { x, y } = gameState.playerPos;
    // Determine target tile based on facing direction
    let targetX = x;
    let targetY = y;

    switch (gameState.playerFacing) {
      case Direction.UP: targetY -= 1; break;
      case Direction.DOWN: targetY += 1; break;
      case Direction.LEFT: targetX -= 1; break;
      case Direction.RIGHT: targetX += 1; break;
    }

    const targetTile = tiles.find(t => t.x === targetX && t.y === targetY);

    if (!targetTile || !targetTile.interactable) {
      addLog("Nothing interesting here.", 'INFO');
      return;
    }

    const { interactable } = targetTile;

    // Shift Check
    if (interactable.isHidden && !gameState.isShiftActive) {
      addLog("You sense something... but reality obscures it.", 'INFO');
      return;
    }

    // Interaction Logic
    if (interactable.type === InteractableType.NPC) {
      addLog(`${interactable.name}: "${interactable.dialogue?.[0]}"`, 'DIALOGUE');
    } else if (interactable.type === InteractableType.ITEM) {
        if (interactable.itemReward) {
            setGameState(prev => ({
                ...prev,
                inventory: [...prev.inventory, interactable.itemReward!]
            }));
            addLog(`Acquired: ${interactable.itemReward.name}`, 'INFO');
            
            // Remove item from map (Mutate tiles locally for proto)
            setTiles(prev => prev.map(t => 
                t.id === targetTile.id 
                ? { ...t, interactable: undefined } 
                : t
            ));
        }
    } else if (interactable.type === InteractableType.ENEMY) {
        addLog("Combat protocols initialized. (Combat System WIP)", 'COMBAT');
        // Placeholder for Phase 3 Combat
    }

  }, [gameState.playerPos, gameState.playerFacing, gameState.isShiftActive, tiles, addLog]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState.isCombatActive) return;

    setGameState(prev => {
      const newX = prev.playerPos.x + dx;
      const newY = prev.playerPos.y + dy;

      // Boundary Check
      if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) return prev;

      // Collision Check
      const targetTile = tiles.find(t => t.x === newX && t.y === newY);
      if (targetTile?.type === TileType.WALL && !prev.isShiftActive) {
          // Wall bump effect could go here
          return prev; 
      }
      // Water Check
      if (targetTile?.type === TileType.WATER) return prev;

      // Determine Facing
      let newFacing = prev.playerFacing;
      if (dx > 0) newFacing = Direction.RIGHT;
      if (dx < 0) newFacing = Direction.LEFT;
      if (dy > 0) newFacing = Direction.DOWN;
      if (dy < 0) newFacing = Direction.UP;

      return {
        ...prev,
        playerPos: { x: newX, y: newY },
        playerFacing: newFacing
      };
    });
  }, [tiles, gameState.isCombatActive]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          movePlayer(0, -1);
          break;
        case 's':
        case 'ArrowDown':
          movePlayer(0, 1);
          break;
        case 'a':
        case 'ArrowLeft':
          movePlayer(-1, 0);
          break;
        case 'd':
        case 'ArrowRight':
          movePlayer(1, 0);
          break;
        case ' ': // Spacebar
          e.preventDefault(); // Prevent scrolling
          toggleShift();
          break;
        case 'e': // Interaction
        case 'Enter':
            handleInteraction();
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, toggleShift, handleInteraction]);

  return {
    tiles,
    gameState,
    actions: {
        movePlayer,
        toggleShift,
        handleInteraction
    }
  };
};