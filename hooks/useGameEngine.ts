
import { useState, useEffect, useCallback } from 'react';
import { GameState, Direction, Position, LogEntry, Tile, InteractableType, TileType, TransitionMetadata, Skill, Item } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_LOG_MESSAGE, loadZoneData, PLAYER_SKILLS, DIALOGUE_DB } from '../constants';

const SAVE_KEY = 'ethershift_save_protocol_alpha';

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

// Helper to clean tiles based on history (removes killed enemies/looted chests)
const filterTilesByHistory = (tiles: Tile[], interactedIds: string[]): Tile[] => {
    if (interactedIds.length === 0) return tiles;
    
    return tiles.map(tile => {
        if (tile.interactable && interactedIds.includes(tile.interactable.id)) {
            return { ...tile, interactable: undefined };
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
    isDialogueActive: false,
    activeDialogue: null,
    interactedEntityIds: [],
    isGameOver: false
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

  // --- System Operations (Save/Load) ---

  const saveGame = useCallback(() => {
      if (gameState.isCombatActive || gameState.isTransitioning || gameState.isDialogueActive || gameState.isGameOver) {
          addLog("ERROR: Cannot backup during active protocols.", 'SYSTEM');
          return;
      }

      const payload = JSON.stringify({
          gameState,
          tiles
      });
      localStorage.setItem(SAVE_KEY, payload);
      addLog("SYSTEM BACKUP COMPLETE. MEMORY SECURED.", 'SYSTEM');
  }, [gameState, tiles, addLog]);

  const loadGame = useCallback(() => {
      const rawData = localStorage.getItem(SAVE_KEY);
      if (!rawData) {
          addLog("ERROR: No backup found in local drives.", 'SYSTEM');
          return;
      }

      try {
          const parsed = JSON.parse(rawData);
          // Basic validation could go here
          setGameState(parsed.gameState);
          setTiles(parsed.tiles);
          addLog("SYSTEM RESTORED. WELCOME BACK, OPERATOR.", 'SYSTEM');
      } catch (e) {
          console.error(e);
          addLog("CRITICAL ERROR: Corrupted backup file.", 'SYSTEM');
      }
  }, [addLog]);

  const resetGame = useCallback(() => {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
  }, []);

  // --- Initialization Effect ---
  useEffect(() => {
    // Initial load logic
    const initialZoneId = 'sector-01';
    const startPos = { x: 2, y: 5 };
    
    let initialTiles = loadZoneData(initialZoneId);
    
    // Check local storage for persistence existence to filter immediately (prevent flash)
    const rawData = localStorage.getItem(SAVE_KEY);
    if (rawData) {
        try {
            // We don't auto-load the game, but we could check ID history if we wanted to.
            // For now, standard new game behavior is fine, but let's filter empty history just to be safe
            initialTiles = filterTilesByHistory(initialTiles, []);
        } catch(e) {}
    }
    
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
    if (gameState.isCombatActive || gameState.isTransitioning || gameState.isDialogueActive || gameState.isGameOver) return;
    setGameState(prev => {
      const newState = !prev.isShiftActive;
      addLog(newState ? ">> ETHER SHIFT ACTIVATED <<" : "Shift disengaged. Reality stabilized.", 'SYSTEM');
      return { ...prev, isShiftActive: newState };
    });
  }, [addLog, gameState.isCombatActive, gameState.isTransitioning, gameState.isDialogueActive, gameState.isGameOver]);

  // --- Combat Logic: Resolve Turn ---
  
  const resolveCombatTurn = useCallback((enemySurvivorsHp: number, enemyId: string) => {
      // Enemy Turn
      setGameState(prev => {
          // SAFETY CHECK: If combat ended (fled/died) OR if the enemy ID doesn't match (race condition), abort.
          if (!prev.isCombatActive || !prev.activeEnemy || prev.activeEnemy.id !== enemyId) return prev;

          const enemyDamage = Math.max(1, (prev.activeEnemy?.attack || 5) - Math.floor(prev.stats.defense / 2));
          const playerNewHp = Math.max(0, prev.stats.hp - enemyDamage);

          addLog(`${prev.activeEnemy?.name} strikes! You take ${enemyDamage} DMG.`, 'COMBAT');

          if (playerNewHp <= 0) {
              addLog("CRITICAL FAILURE. INTEGRITY COMPROMISED.", 'SYSTEM');
              return {
                  ...prev,
                  stats: { ...prev.stats, hp: 0 },
                  isGameOver: true,
                  isCombatActive: false // Technically combat is over because you lost
              };
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

  // --- Inventory Management ---

  const consumeItem = useCallback((item: Item) => {
      if (gameState.isTransitioning || gameState.isGameOver) {
          addLog("Cannot use items during this protocol.", 'SYSTEM');
          return;
      }
      
      if (gameState.isCombatActive && gameState.combatState.phase === 'WAITING') {
          return; // Prevent double usage during enemy turn
      }

      if (item.type !== 'CONSUMABLE') {
          addLog(`Item [${item.name}] is not consumable.`, 'INFO');
          return;
      }

      setGameState(prev => {
          // Safety Check: Don't consume if already full
          if (item.id === 'item_stim_01' && prev.stats.hp >= prev.stats.maxHp) {
             addLog(`System integrity optimal. Conservation mode active.`, 'INFO');
             return prev;
          }

          // Remove 1 instance of the item
          const index = prev.inventory.findIndex(i => i.id === item.id);
          if (index === -1) return prev;

          const newInventory = [...prev.inventory];
          newInventory.splice(index, 1);

          // Apply Effects
          let hpRestored = 0;
          if (item.id === 'item_stim_01') {
              hpRestored = 40;
          }

          const newHp = Math.min(prev.stats.maxHp, prev.stats.hp + hpRestored);
          
          addLog(`Consumed [${item.name}]. Systems repaired (+${hpRestored} HP).`, 'SYSTEM');

          // If in combat, this consumes a turn
          if (prev.isCombatActive && prev.activeEnemy) {
              const enemyId = prev.activeEnemy.id;
              setTimeout(() => resolveCombatTurn(prev.activeEnemy!.hp, enemyId), 1000);
              return {
                  ...prev,
                  stats: { ...prev.stats, hp: newHp },
                  inventory: newInventory,
                  combatState: { ...prev.combatState, phase: 'WAITING' } // Lock input
              };
          }

          return {
              ...prev,
              stats: { ...prev.stats, hp: newHp },
              inventory: newInventory
          };
      });
  }, [addLog, gameState.isTransitioning, gameState.isGameOver, gameState.isCombatActive, gameState.combatState.phase, resolveCombatTurn]);


  // --- Zone Transition Logic ---

  const triggerZoneTransition = useCallback((meta: TransitionMetadata) => {
      if (gameState.isTransitioning) return;

      // 1. Lock Input & Show Transition UI
      setGameState(prev => ({ ...prev, isTransitioning: true }));
      addLog(`INITIATING HANDSHAKE: ${meta.targetZoneName}...`, 'SYSTEM');

      // 2. Delay for visual effect (Simulate load/travel time)
      setTimeout(() => {
          // 3. Load New Zone Data
          let newTiles = loadZoneData(meta.targetZoneId);
          
          // 4. Apply History (Remove previously killed/looted entities)
          // We rely on the closure's access to the most recent ID list or state
          setGameState(currentState => {
              newTiles = filterTilesByHistory(newTiles, currentState.interactedEntityIds);
              const revealedTiles = calculateVisibility(newTiles, meta.targetPosition);

              setTiles(revealedTiles);
              addLog(`CONNECTION ESTABLISHED: ${meta.targetZoneName}`, 'SYSTEM');

              return {
                  ...currentState,
                  playerPos: meta.targetPosition,
                  playerFacing: meta.targetFacing,
                  currentZoneId: meta.targetZoneId,
                  currentZoneName: meta.targetZoneName,
                  isTransitioning: false // Unlock
              };
          });
      }, 1500);

  }, [gameState.isTransitioning, addLog]);

  // --- Dialogue Logic ---

  const selectDialogueOption = useCallback((nextId: string | null) => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;

      // If nextId is null, close dialogue
      if (nextId === null) {
        return {
          ...prev,
          isDialogueActive: false,
          activeDialogue: null
        };
      }

      // Look up next node in the tree
      const tree = DIALOGUE_DB[prev.activeDialogue.treeId];
      const nextNode = tree?.nodes[nextId];

      if (!nextNode) {
        // Fallback closure if node missing
        return { ...prev, isDialogueActive: false, activeDialogue: null };
      }

      return {
        ...prev,
        activeDialogue: {
          ...prev.activeDialogue,
          currentNode: nextNode
        }
      };
    });
  }, []);

  // --- Combat Logic: Player Turn ---

  const executeCombatAction = useCallback((action: 'ATTACK' | 'FLEE' | 'SKILL_EXECUTE', skill?: Skill) => {
      if (!gameState.activeEnemy) return;
      if (gameState.combatState.phase === 'WAITING') return; // Prevent input spam

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
          let newHp = Math.min(prev.stats.maxHp, prev.stats.hp + healAmount);
          
          if (healAmount > 0) {
              addLog(`System Restore active. Recovered ${healAmount} HP.`, 'SYSTEM');
          }
          if (damage > 0) {
               addLog(`Executed ${actionName} for ${damage} DMG.`, 'COMBAT');
          }

          const enemyNewHp = (prev.activeEnemy?.hp || 0) - damage;
          const enemyId = prev.activeEnemy!.id;
          
          if (enemyNewHp <= 0) {
             // Victory
             const { xpReward, creditsReward, itemReward, id } = prev.activeEnemy!;
             // Extract original Interactable ID from the combat ID (combat::id)
             const originalId = id.split('::')[1];

             addLog(`Target eliminated. +${xpReward} XP, +${creditsReward} Credits`, 'SYSTEM');
             
             // Level Up Calculation
             const newTotalXp = prev.stats.xp + xpReward;
             const xpThreshold = prev.stats.level * 100;
             let newStats = { ...prev.stats, mp: newMp, hp: newHp, xp: newTotalXp, credits: prev.stats.credits + creditsReward };
             
             if (newTotalXp >= xpThreshold) {
                 addLog(`>> KERNEL UPGRADE: LEVEL ${prev.stats.level + 1} ESTABLISHED <<`, 'SYSTEM');
                 const newLevel = prev.stats.level + 1;
                 const newMaxHp = prev.stats.maxHp + 10;
                 const newMaxMp = prev.stats.maxMp + 5;
                 
                 newStats = {
                     ...newStats,
                     level: newLevel,
                     maxHp: newMaxHp,
                     maxMp: newMaxMp,
                     attack: prev.stats.attack + 2,
                     defense: prev.stats.defense + 1,
                     hp: newMaxHp, // Full Heal
                     mp: newMaxMp   // Full MP
                 };
             }

             if (itemReward) addLog(`LOOT: Retrieved [${itemReward.name}]`, 'INFO');

             // Remove Enemy from World
             setTiles(tPrev => tPrev.map(t => 
                t.interactable?.id === originalId 
                ? { ...t, interactable: undefined } 
                : t
             ));

             return {
                 ...prev,
                 isCombatActive: false,
                 activeEnemy: null,
                 inventory: itemReward ? [...prev.inventory, itemReward] : prev.inventory,
                 stats: newStats,
                 combatState: { phase: 'MENU', selectedSkillId: null, inputBuffer: [], lastInputResult: 'NEUTRAL' },
                 // PERSISTENCE: Add enemy ID to history so it doesn't respawn
                 interactedEntityIds: [...prev.interactedEntityIds, originalId]
             };
          }

          // If enemy lives, pass to resolve turn. 
          // Trigger timeout for enemy counter-attack and LOCK INPUT
          setTimeout(() => resolveCombatTurn(enemyNewHp, enemyId), 1000); 

          return {
              ...prev,
              stats: { ...prev.stats, mp: newMp, hp: newHp },
              activeEnemy: { ...prev.activeEnemy!, hp: enemyNewHp },
              combatState: { ...prev.combatState, phase: 'WAITING' } // Lock input
          };
      });

  }, [gameState.activeEnemy, gameState.stats, gameState.combatState.phase, addLog, resolveCombatTurn]);

  // Public handler for UI clicks
  const handleCombatUI = (action: 'ATTACK' | 'FLEE' | 'OPEN_SKILLS' | 'CANCEL_SKILL' | 'SELECT_SKILL', skillId?: string) => {
      if (gameState.isGameOver) return;
      if (gameState.combatState.phase === 'WAITING') return;

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
    if (gameState.isCombatActive || gameState.isTransitioning || gameState.isDialogueActive || gameState.isGameOver) return;

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
      // CHECK FOR COMPLEX DIALOGUE
      if (interactable.dialogueId && DIALOGUE_DB[interactable.dialogueId]) {
        const tree = DIALOGUE_DB[interactable.dialogueId];
        setGameState(prev => ({
          ...prev,
          isDialogueActive: true,
          activeDialogue: {
            treeId: tree.id,
            currentNode: tree.nodes[tree.startNodeId]
          }
        }));
      } else {
        // Fallback to simple bark
        addLog(`${interactable.name}: "${interactable.dialogue?.[0]}"`, 'DIALOGUE');
      }
    } else if (interactable.type === InteractableType.ITEM) {
        if (interactable.itemReward) {
            setGameState(prev => ({
                ...prev,
                inventory: [...prev.inventory, interactable.itemReward!],
                // PERSISTENCE: Track looted item
                interactedEntityIds: [...prev.interactedEntityIds, interactable.id] 
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

  }, [gameState, tiles, addLog, triggerZoneTransition]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState.isCombatActive || gameState.isTransitioning || gameState.isDialogueActive || gameState.isGameOver) return;

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
  }, [tiles, gameState.isCombatActive, gameState.isTransitioning, gameState.isDialogueActive, gameState.isGameOver, triggerZoneTransition]);

  // --- Combat Input Handling (Runes) ---
  const handleRuneInput = useCallback((dir: Direction) => {
      if (gameState.combatState.phase !== 'INPUT' || !gameState.combatState.selectedSkillId || gameState.isGameOver) return;
      
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

  }, [gameState.combatState, addLog, executeCombatAction, gameState.isGameOver]);


  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      
      // Game Over Lock
      if (gameState.isGameOver) return;

      // Dialogue Controls
      if (gameState.isDialogueActive && gameState.activeDialogue) {
        // Number keys for options
        if (['1', '2', '3', '4'].includes(e.key)) {
          const index = parseInt(e.key) - 1;
          const options = gameState.activeDialogue.currentNode.options;
          if (options[index]) {
            selectDialogueOption(options[index].nextId);
          }
        }
        // Escape to exit if allowed (or just basic exit safety)
        if (e.key === 'Escape') {
          // Optional: Check if there is a 'leave' option, otherwise force close
           selectDialogueOption(null);
        }
        return;
      }

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
  }, [movePlayer, toggleShift, handleInteraction, gameState.isCombatActive, gameState.combatState, gameState.isTransitioning, handleRuneInput, gameState.isDialogueActive, selectDialogueOption, gameState.activeDialogue, gameState.isGameOver]);

  return {
    tiles,
    gameState,
    actions: {
        movePlayer,
        toggleShift,
        consumeItem,
        handleInteraction,
        handleCombatUI,
        handleRuneInput, // EXPOSED
        selectDialogueOption,
        system: {
            saveGame,
            loadGame,
            resetGame
        }
    }
  };
};
