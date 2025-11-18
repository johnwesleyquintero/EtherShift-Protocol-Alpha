
import { useState, useEffect, useCallback } from 'react';
import { GameState, Direction, Position, LogEntry, Tile, InteractableType, TileType } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_LOG_MESSAGE, generateZone } from '../constants';

// Helper to calculate visibility
const calculateVisibility = (tiles: Tile[], center: Position, radius: number = 2.5): Tile[] => {
  return tiles.map(tile => {
    if (tile.isRevealed) return tile; // Already revealed, stay revealed

    // Euclidean distance check
    const distance = Math.sqrt(Math.pow(tile.x - center.x, 2) + Math.pow(tile.y - center.y, 2));
    
    if (distance <= radius) {
      return { ...tile, isRevealed: true };
    }
    return tile;
  });
};

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
      attack: 10,
      defense: 5,
      level: 1,
      xp: 0,
      credits: 0,
    },
    inventory: [],
    currentZone: 'Sector-01: Awakening',
    isShiftActive: false,
    gameLog: [],
    isCombatActive: false,
    activeEnemy: null,
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
    // Reveal starting area
    const revealedTiles = calculateVisibility(initialTiles, { x: 2, y: 5 });
    setTiles(revealedTiles);
    addLog(INITIAL_LOG_MESSAGE, 'SYSTEM');
  }, [addLog]);

  // --- Actions ---

  const toggleShift = useCallback(() => {
    if (gameState.isCombatActive) return;
    setGameState(prev => {
      const newState = !prev.isShiftActive;
      addLog(newState ? ">> ETHER SHIFT ACTIVATED <<" : "Shift disengaged. Reality stabilized.", 'SYSTEM');
      return { ...prev, isShiftActive: newState };
    });
  }, [addLog, gameState.isCombatActive]);

  // --- Combat Logic ---

  const resolveCombatTurn = useCallback((enemySurvivorsHp: number, enemyId: string) => {
      // Enemy Turn
      setGameState(prev => {
          const enemyDamage = Math.max(1, (prev.activeEnemy?.attack || 5) - Math.floor(prev.stats.defense / 2));
          const playerNewHp = Math.max(0, prev.stats.hp - enemyDamage);

          addLog(`${prev.activeEnemy?.name} strikes! You take ${enemyDamage} DMG.`, 'COMBAT');

          if (playerNewHp <= 0) {
              addLog("CRITICAL FAILURE. SYSTEM SHUTTING DOWN...", 'SYSTEM');
              // TODO: Handle Game Over
          }

          return {
              ...prev,
              stats: { ...prev.stats, hp: playerNewHp },
              activeEnemy: prev.activeEnemy ? { ...prev.activeEnemy, hp: enemySurvivorsHp } : null
          };
      });
  }, [addLog]);

  const handleCombatAction = useCallback((action: 'ATTACK' | 'SKILL' | 'FLEE') => {
      if (!gameState.activeEnemy) return;

      if (action === 'FLEE') {
          addLog("You disengaged from combat.", 'INFO');
          setGameState(prev => ({ ...prev, isCombatActive: false, activeEnemy: null }));
          return;
      }

      // Player Turn Calculation
      let damage = 0;
      let mpCost = 0;

      if (action === 'ATTACK') {
          damage = Math.floor(gameState.stats.attack * (0.8 + Math.random() * 0.4)); // +/- 20% variance
      } else if (action === 'SKILL') {
          mpCost = 10;
          if (gameState.stats.mp < mpCost) {
              addLog("Insufficient Ether (MP)!", 'SYSTEM');
              return;
          }
          damage = Math.floor(gameState.stats.attack * 2.5); // Big damage
          addLog("You cast 'Code Breaker'!", 'COMBAT');
      }

      // Apply costs
      setGameState(prev => ({
          ...prev,
          stats: { ...prev.stats, mp: prev.stats.mp - mpCost }
      }));

      // Apply Damage to Enemy
      const enemyNewHp = gameState.activeEnemy.hp - damage;
      addLog(`You dealt ${damage} damage to ${gameState.activeEnemy.name}.`, 'COMBAT');

      if (enemyNewHp <= 0) {
          // Victory
          const { xpReward, creditsReward, itemReward } = gameState.activeEnemy;
          
          let logMsg = `Target eliminated. +${xpReward} XP`;
          if (creditsReward > 0) logMsg += `, +${creditsReward} Credits`;
          addLog(logMsg, 'SYSTEM');
          
          let newInventory = [...gameState.inventory];
          if (itemReward) {
              newInventory.push(itemReward);
              addLog(`LOOT: Retrieved [${itemReward.name}]`, 'INFO');
          }

          // Remove enemy from world
          const enemyTileId = gameState.activeEnemy.id; // We stored tile id here via logic below
          setTiles(prev => prev.map(t => {
             // Logic to find the tile with this interactable
             if (t.interactable?.id === enemyTileId.split('::')[1]) {
                 return { ...t, interactable: undefined };
             }
             return t;
          }));

          // Update State
          setGameState(prev => ({
              ...prev,
              isCombatActive: false,
              activeEnemy: null,
              inventory: newInventory,
              stats: { 
                  ...prev.stats, 
                  xp: prev.stats.xp + xpReward,
                  credits: prev.stats.credits + creditsReward
              }
          }));

      } else {
          // Trigger Enemy Turn
          resolveCombatTurn(enemyNewHp, gameState.activeEnemy.id);
      }

  }, [gameState, addLog, resolveCombatTurn]);


  const handleInteraction = useCallback(() => {
    if (gameState.isCombatActive) return;

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
        if (interactable.combatStats) {
            addLog(`⚠️ ENCOUNTER: ${interactable.name} engaged!`, 'COMBAT');
            setGameState(prev => ({
                ...prev,
                isCombatActive: true,
                activeEnemy: {
                    id: `combat::${interactable.id}`, // store ID to remove later
                    name: interactable.name,
                    ...interactable.combatStats!,
                    creditsReward: interactable.combatStats!.creditsReward || 0,
                    itemReward: interactable.itemReward // Pass loot info to active state
                }
            }));
        }
    }

  }, [gameState.playerPos, gameState.playerFacing, gameState.isShiftActive, gameState.isCombatActive, tiles, addLog]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState.isCombatActive) return;

    setGameState(prev => {
      const newX = prev.playerPos.x + dx;
      const newY = prev.playerPos.y + dy;

      // Boundary Check
      if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) return prev;

      // Collision Check
      const targetTile = tiles.find(t => t.x === newX && t.y === newY);
      
      // Wall Collision
      if (targetTile?.type === TileType.WALL && !prev.isShiftActive) {
          return prev; 
      }
      
      // Water Collision
      if (targetTile?.type === TileType.WATER) return prev;

      // Determine Facing
      let newFacing = prev.playerFacing;
      if (dx > 0) newFacing = Direction.RIGHT;
      if (dx < 0) newFacing = Direction.LEFT;
      if (dy > 0) newFacing = Direction.DOWN;
      if (dy < 0) newFacing = Direction.UP;

      // Update Fog of War (Side Effect in State Update)
      setTiles(currentTiles => calculateVisibility(currentTiles, { x: newX, y: newY }));

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
      // Combat Controls
      if (gameState.isCombatActive) return; // Combat has its own UI controls for now

      // Movement Controls
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
  }, [movePlayer, toggleShift, handleInteraction, gameState.isCombatActive]);

  return {
    tiles,
    gameState,
    actions: {
        movePlayer,
        toggleShift,
        handleInteraction,
        handleCombatAction
    }
  };
};
