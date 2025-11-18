
import { useState, useEffect, useCallback } from 'react';
import { GameState, Direction, Position, LogEntry, Tile, InteractableType, TileType, TransitionMetadata, Skill } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_LOG_MESSAGE, loadZoneData, PLAYER_SKILLS } from '../constants';

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
    currentZoneId: 'sector-01',
    currentZoneName: 'Sector-01: Awakening',
    isShiftActive: false,
    gameLog: [],
    isCombatActive: false,
    combatState: {
        phase: 'MENU',
        selectedSkillId: null,
        inputBuffer: [],
        lastInputResult: 'NEUTRAL'
    },
    activeEnemy: null,
    isTransitioning: false,
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
    // Initial load logic
    const initialZoneId = 'sector-01';
    const initialTiles = loadZoneData(initialZoneId);
    const startPos = { x: 2, y: 5 };
    const revealedTiles = calculateVisibility(initialTiles, startPos);
    
    setTiles(revealedTiles);
    setGameState(prev => ({
        ...prev,
        currentZoneId: initialZoneId,
        playerPos: startPos
    }));
    
    addLog(INITIAL_LOG_MESSAGE, 'SYSTEM');
  }, [addLog]);

  // --- Actions ---

  const toggleShift = useCallback(() => {
    if (gameState.isCombatActive || gameState.isTransitioning) return;
    setGameState(prev => {
      const newState = !prev.isShiftActive;
      addLog(newState ? ">> ETHER SHIFT ACTIVATED <<" : "Shift disengaged. Reality stabilized.", 'SYSTEM');
      return { ...prev, isShiftActive: newState };
    });
  }, [addLog, gameState.isCombatActive, gameState.isTransitioning]);

  // --- Zone Transition Logic ---

  const triggerZoneTransition = useCallback((meta: TransitionMetadata) => {
      if (gameState.isTransitioning) return;

      // 1. Lock Input & Show Transition UI
      setGameState(prev => ({ ...prev, isTransitioning: true }));
      addLog(`INITIATING HANDSHAKE: ${meta.targetZoneName}...`, 'SYSTEM');

      // 2. Delay for visual effect (Simulate load/travel time)
      setTimeout(() => {
          // 3. Load New Zone Data
          const newTiles = loadZoneData(meta.targetZoneId);
          const revealedTiles = calculateVisibility(newTiles, meta.targetPosition);

          // 4. Update State
          setTiles(revealedTiles);
          setGameState(prev => ({
              ...prev,
              playerPos: meta.targetPosition,
              playerFacing: meta.targetFacing,
              currentZoneId: meta.targetZoneId,
              currentZoneName: meta.targetZoneName,
              isTransitioning: false // Unlock
          }));

          addLog(`CONNECTION ESTABLISHED: ${meta.targetZoneName}`, 'SYSTEM');
      }, 1500);

  }, [gameState.isTransitioning, addLog]);

  // --- Combat Logic ---

  const resolveCombatTurn = useCallback((enemySurvivorsHp: number) => {
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
              activeEnemy: prev.activeEnemy ? { ...prev.activeEnemy, hp: enemySurvivorsHp } : null,
              // Reset to Menu
              combatState: { ...prev.combatState, phase: 'MENU', inputBuffer: [], lastInputResult: 'NEUTRAL' }
          };
      });
  }, [addLog]);

  const executeCombatAction = useCallback((action: 'ATTACK' | 'FLEE' | 'SKILL_EXECUTE', skill?: Skill) => {
      if (!gameState.activeEnemy) return;

      if (action === 'FLEE') {
          addLog("You disengaged from combat.", 'INFO');
          setGameState(prev => ({ 
              ...prev, 
              isCombatActive: false, 
              activeEnemy: null,
              combatState: { phase: 'MENU', selectedSkillId: null, inputBuffer: [], lastInputResult: 'NEUTRAL' }
          }));
          return;
      }

      // Logic for Player Turn
      let damage = 0;
      let mpCost = 0;
      let healAmount = 0;
      let actionName = "Attack";

      if (action === 'ATTACK') {
          damage = Math.floor(gameState.stats.attack * (0.8 + Math.random() * 0.4)); // +/- 20% variance
      } else if (action === 'SKILL_EXECUTE' && skill) {
          actionName = skill.name;
          mpCost = skill.mpCost;
          
          if (skill.type === 'DMG') {
              damage = Math.floor(gameState.stats.attack * skill.damageScale);
          } else if (skill.type === 'HEAL') {
              healAmount = 30; // Flat heal for now
              damage = 0;
          }
      }

      // Apply Stats
      setGameState(prev => {
          const newMp = prev.stats.mp - mpCost;
          const newHp = Math.min(prev.stats.maxHp, prev.stats.hp + healAmount);
          
          if (healAmount > 0) {
              addLog(`System Restore active. Recovered ${healAmount} HP.`, 'SYSTEM');
          }
          if (damage > 0) {
               addLog(`Executed ${actionName} for ${damage} DMG.`, 'COMBAT');
          }

          const enemyNewHp = (prev.activeEnemy?.hp || 0) - damage;
          
          if (enemyNewHp <= 0) {
             // Victory
             const { xpReward, creditsReward, itemReward } = prev.activeEnemy!;
             addLog(`Target eliminated. +${xpReward} XP, +${creditsReward} Credits`, 'SYSTEM');
             
             if (itemReward) addLog(`LOOT: Retrieved [${itemReward.name}]`, 'INFO');

             // Remove Enemy from World
             const enemyTileId = prev.activeEnemy!.id;
             setTiles(tPrev => tPrev.map(t => 
                t.interactable?.id === enemyTileId.split('::')[1] 
                ? { ...t, interactable: undefined } 
                : t
             ));

             return {
                 ...prev,
                 isCombatActive: false,
                 activeEnemy: null,
                 inventory: itemReward ? [...prev.inventory, itemReward] : prev.inventory,
                 stats: { ...prev.stats, mp: newMp, hp: newHp, xp: prev.stats.xp + xpReward, credits: prev.stats.credits + creditsReward },
                 combatState: { phase: 'MENU', selectedSkillId: null, inputBuffer: [], lastInputResult: 'NEUTRAL' }
             };
          }

          // If enemy lives, pass to resolve turn
          setTimeout(() => resolveCombatTurn(enemyNewHp), 1000); // Small delay for pacing

          return {
              ...prev,
              stats: { ...prev.stats, mp: newMp, hp: newHp },
              activeEnemy: { ...prev.activeEnemy!, hp: enemyNewHp }
          };
      });

  }, [gameState, addLog, resolveCombatTurn]);

  // Public handler for UI clicks
  const handleCombatUI = (action: 'ATTACK' | 'FLEE' | 'OPEN_SKILLS' | 'CANCEL_SKILL' | 'SELECT_SKILL', skillId?: string) => {
      if (action === 'OPEN_SKILLS') {
          setGameState(prev => ({ ...prev, combatState: { ...prev.combatState, phase: 'SKILL_SELECT' } }));
      } else if (action === 'CANCEL_SKILL') {
          setGameState(prev => ({ ...prev, combatState: { ...prev.combatState, phase: 'MENU', selectedSkillId: null } }));
      } else if (action === 'SELECT_SKILL' && skillId) {
          setGameState(prev => ({ 
              ...prev, 
              combatState: { 
                  ...prev.combatState, 
                  phase: 'INPUT', 
                  selectedSkillId: skillId,
                  inputBuffer: [],
                  lastInputResult: 'NEUTRAL'
              } 
          }));
          addLog("INITIATING RUNE SEQUENCE...", 'SYSTEM');
      } else {
          executeCombatAction(action as any);
      }
  };

  const handleInteraction = useCallback(() => {
    if (gameState.isCombatActive || gameState.isTransitioning) return;

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

    // Special Case: Standing ON a gate
    const standingTile = tiles.find(t => t.x === x && t.y === y);
    if (standingTile?.interactable?.type === InteractableType.ZONE_GATE && standingTile.interactable.transition) {
        triggerZoneTransition(standingTile.interactable.transition);
        return;
    }

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
                combatState: { phase: 'MENU', selectedSkillId: null, inputBuffer: [], lastInputResult: 'NEUTRAL' }, // Reset combat state
                activeEnemy: {
                    id: `combat::${interactable.id}`, // store ID to remove later
                    name: interactable.name,
                    ...interactable.combatStats!,
                    creditsReward: interactable.combatStats!.creditsReward || 0,
                    itemReward: interactable.itemReward // Pass loot info to active state
                }
            }));
        }
    } else if (interactable.type === InteractableType.ZONE_GATE) {
        if (interactable.transition) {
            triggerZoneTransition(interactable.transition);
        }
    }

  }, [gameState.playerPos, gameState.playerFacing, gameState.isShiftActive, gameState.isCombatActive, gameState.isTransitioning, tiles, addLog, triggerZoneTransition]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState.isCombatActive || gameState.isTransitioning) return;

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

      // Check if we walked ONTO a gate (auto-transition)
      if (targetTile?.interactable?.type === InteractableType.ZONE_GATE && targetTile.interactable.transition) {
         // We trigger the transition asynchronously to allow the visual "step" onto the tile first
         setTimeout(() => {
             triggerZoneTransition(targetTile.interactable!.transition!);
         }, 100);
      }

      // Update Fog of War (Side Effect in State Update)
      setTiles(currentTiles => calculateVisibility(currentTiles, { x: newX, y: newY }));

      return {
        ...prev,
        playerPos: { x: newX, y: newY },
        playerFacing: newFacing
      };
    });
  }, [tiles, gameState.isCombatActive, gameState.isTransitioning, triggerZoneTransition]);

  // --- Combat Input Handling (Runes) ---
  const handleRuneInput = useCallback((dir: Direction) => {
      if (gameState.combatState.phase !== 'INPUT' || !gameState.combatState.selectedSkillId) return;
      
      const skill = Object.values(PLAYER_SKILLS).find(s => s.id === gameState.combatState.selectedSkillId);
      if (!skill) return;

      setGameState(prev => {
          const currentBuffer = [...prev.combatState.inputBuffer, dir];
          const currentIndex = currentBuffer.length - 1;
          
          // Validate current key against target sequence
          if (skill.sequence[currentIndex] !== dir) {
              // Mistake!
              addLog("RUNE SEQUENCE FAILED. REBOOTING...", 'COMBAT');
              return {
                  ...prev,
                  combatState: { 
                      ...prev.combatState, 
                      inputBuffer: [], // Reset buffer
                      lastInputResult: 'FAIL'
                  }
              };
          }

          // Correct Key
          if (currentBuffer.length === skill.sequence.length) {
              // Sequence Complete!
              // We execute the skill after a tiny delay for visual feedback
              setTimeout(() => executeCombatAction('SKILL_EXECUTE', skill), 300);
              
              return {
                  ...prev,
                  combatState: {
                      ...prev.combatState,
                      inputBuffer: currentBuffer,
                      lastInputResult: 'SUCCESS'
                  }
              };
          }

          // Sequence In Progress
          return {
              ...prev,
              combatState: {
                  ...prev.combatState,
                  inputBuffer: currentBuffer,
                  lastInputResult: 'NEUTRAL'
              }
          };
      });

  }, [gameState.combatState, addLog, executeCombatAction]);


  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      
      // Combat Controls - Rune Input
      if (gameState.isCombatActive) {
          if (gameState.combatState.phase === 'INPUT') {
              e.preventDefault();
              switch (e.key) {
                  case 'w': case 'ArrowUp': handleRuneInput(Direction.UP); break;
                  case 's': case 'ArrowDown': handleRuneInput(Direction.DOWN); break;
                  case 'a': case 'ArrowLeft': handleRuneInput(Direction.LEFT); break;
                  case 'd': case 'ArrowRight': handleRuneInput(Direction.RIGHT); break;
                  case 'Escape': handleCombatUI('CANCEL_SKILL'); break;
              }
          }
          return; // Block movement if in combat
      }

      if (gameState.isTransitioning) return; 

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
  }, [movePlayer, toggleShift, handleInteraction, gameState.isCombatActive, gameState.combatState, gameState.isTransitioning, handleRuneInput]);

  return {
    tiles,
    gameState,
    actions: {
        movePlayer,
        toggleShift,
        handleInteraction,
        handleCombatUI
    }
  };
};
