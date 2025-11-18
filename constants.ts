
import { Item, Tile, TileType, InteractableType } from './types';

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 10;

export const INITIAL_LOG_MESSAGE = "System Online. Neural link established. Welcome back, Architect.";

export const SAMPLE_ITEMS: Record<string, Item> = {
  ETHER_SHARD: {
    id: 'item_shard_01',
    name: 'Ether Shard',
    description: 'A fragment of raw potential. It hums with memory.',
    type: 'ARTIFACT',
  },
  OLD_KEY: {
    id: 'item_key_01',
    name: 'Rusty Access Card',
    description: 'Pre-collapse tech. Reads: "Sector 4 Auth".',
    type: 'KEY',
  },
  HEALTH_STIM: {
    id: 'item_stim_01',
    name: 'Bio-Stim Pack',
    description: 'Emergency nanobots. Restores HP.',
    type: 'CONSUMABLE',
  }
};

// A small sample map generator (Prototyping Module)
export const generateZone = (width: number, height: number): Tile[] => {
  const tiles: Tile[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `tile_${x}_${y}`;
      let type = TileType.EMPTY;
      let interactable = undefined;

      // Create boundaries
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        type = TileType.WALL;
      }

      // Add some obstacles
      if ((x === 3 && y > 2 && y < 7) || (x === 8 && y === 3)) {
        type = TileType.WALL;
      }

      // Add Water
      if (x > 7 && y > 6) {
        type = TileType.WATER;
      }

      // Add NPC
      if (x === 5 && y === 2) {
        interactable = {
          type: InteractableType.NPC,
          id: 'npc_sage',
          name: 'WesAI Echo',
          dialogue: [
            "You've returned. Finally.",
            "The code is fragmented, Architect. We need to rebuild the Source.",
            "Press [SPACE] to activate the Shift. See what is hidden."
          ]
        };
      }

      // Add Hidden Chest (Requires Shift)
      if (x === 10 && y === 1) {
        interactable = {
          type: InteractableType.ITEM,
          id: 'chest_01',
          name: 'Distorted Cache',
          isHidden: true,
          itemReward: SAMPLE_ITEMS.ETHER_SHARD
        };
      }

      // Add Enemy
      if (x === 8 && y === 5) {
        interactable = {
          type: InteractableType.ENEMY,
          id: 'enemy_glitch_01',
          name: 'Glitch Sentinel',
          isHidden: false,
          itemReward: SAMPLE_ITEMS.HEALTH_STIM, // Drops this on death
          combatStats: {
            hp: 50,
            maxHp: 50,
            attack: 8,
            defense: 2,
            xpReward: 25,
            creditsReward: 42 // Drops this on death
          }
        };
      }

      tiles.push({
        id,
        x,
        y,
        type,
        interactable,
        isRevealed: false, // Fog of War enabled: Hidden by default
      });
    }
  }
  return tiles;
};
