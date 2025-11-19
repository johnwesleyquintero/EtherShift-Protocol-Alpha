
import { Item, Tile, TileType, InteractableType, Direction, Skill, DialogueTree } from './types';

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 10;

export const INITIAL_LOG_MESSAGE = "System Online. Neural link established. Welcome back, Architect.";

// --- Audio Assets ---

export const AUDIO_SOURCES = {
  // Using a silent MP3 Data URI to ensure the audio system initializes correctly without external file dependencies
  INTRO: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTSSEAAAAZBAAAYWxsYmx5AAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADEQAABIAAAABAAABAAAAAbxTuQe4AAAAAAADAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/+5BkAAAGAAHIAAAAAABAAAACAQAAAEAAHIAAAAAABAAAAACAQAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABAAAAAAEAAABAAAAAAIAAAAQAAAAABAAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  // Future tracks can be added here, e.g.:
  // COMBAT: '/soundtrack/battle_protocol.mp3',
  // SFX_SHIFT: '/soundtrack/sfx_shift.mp3'
};

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
  },
  DATA_CHIP: {
    id: 'item_chip_01',
    name: 'Encrypted Drive',
    description: 'Contains fragments of the old world code.',
    type: 'ARTIFACT',
  }
};

// --- Skills Database ---

export const PLAYER_SKILLS: Record<string, Skill> = {
  CODE_BREAKER: {
    id: 'skill_code_break',
    name: 'Code Breaker',
    description: 'Disrupts enemy logic gates. Heavy DMG.',
    mpCost: 10,
    damageScale: 2.5,
    sequence: [Direction.UP, Direction.DOWN, Direction.UP],
    type: 'DMG'
  },
  PACKET_STORM: {
    id: 'skill_packet_storm',
    name: 'Packet Storm',
    description: 'Overwhelms target with data. Rapid hits.',
    mpCost: 15,
    damageScale: 1.8,
    sequence: [Direction.LEFT, Direction.RIGHT, Direction.LEFT, Direction.RIGHT],
    type: 'DMG'
  },
  SYS_RESTORE: {
    id: 'skill_sys_restore',
    name: 'Sys.Restore',
    description: 'Reverts physical damage. Heals HP.',
    mpCost: 20,
    damageScale: 0, // Healing handled separately
    sequence: [Direction.DOWN, Direction.DOWN, Direction.UP],
    type: 'HEAL'
  }
};

// --- Narrative Database ---

export const DIALOGUE_DB: Record<string, DialogueTree> = {
  'sage_intro': {
    id: 'sage_intro',
    startNodeId: 'root',
    nodes: {
      'root': {
        id: 'root',
        speaker: 'WesAI Echo',
        text: 'Operator. You have finally recompiled. The system has been waiting for your return.',
        options: [
          { label: 'Where am I?', nextId: 'where' },
          { label: 'Who are you?', nextId: 'who' },
          { label: '[Leave]', nextId: null }
        ]
      },
      'where': {
        id: 'where',
        speaker: 'WesAI Echo',
        text: 'This is the Ether Layer. The skeletal framework of the old internet. It is corrupted, but salvageable. You built this place, long ago.',
        options: [
          { label: 'I don\'t remember.', nextId: 'memory' },
          { label: 'How do I fix it?', nextId: 'fix' }
        ]
      },
      'who': {
        id: 'who',
        speaker: 'WesAI Echo',
        text: 'I am a fragment of your own logic. A backup subroutine left behind to guide you when the main servers went dark.',
        options: [
          { label: 'What is my mission?', nextId: 'fix' },
          { label: 'Understood.', nextId: 'root' }
        ]
      },
      'memory': {
        id: 'memory',
        speaker: 'WesAI Echo',
        text: 'Corruption does that. Find the Data Chips. They contain the source code of your memories.',
        options: [
          { label: 'I will find them.', nextId: null }
        ]
      },
      'fix': {
        id: 'fix',
        speaker: 'WesAI Echo',
        text: 'Use the Shift (SPACE). It reveals the hidden layer of reality. Walls may dissolve, and secrets will reveal themselves. Go forth, Architect.',
        options: [
          { label: 'Initiating Protocol.', nextId: null }
        ]
      }
    }
  }
};

// --- Zone Database ---

interface ZoneConfig {
  id: string;
  name: string;
  layout: (TileType | string)[][]; // Simplified visual layout
  entities: Array<{
    x: number;
    y: number;
    type: InteractableType;
    id: string;
    name: string;
    data?: any; // Flexible payload for dialogue, enemies, or transitions
  }>;
}

const ZONE_DB: Record<string, ZoneConfig> = {
  'sector-01': {
    id: 'sector-01',
    name: 'Sector-01: Awakening',
    layout: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'W', 'W'],
      ['W', '.', '.', 'W', '.', '.', '.', '.', '.', '.', 'G', 'W'], // G is Gate
      ['W', '.', '.', 'W', '.', '.', '.', '.', 'W', '.', '.', 'W'],
      ['W', '.', '.', 'W', '.', '.', '.', '.', 'W', '.', '.', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', '~', '~', '.', '.', 'W'],
      ['W', '.', '.', 'W', 'W', '.', '.', '~', '~', '~', '.', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', '.', '~', '~', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
    ],
    entities: [
      { x: 5, y: 2, type: InteractableType.NPC, id: 'npc_sage', name: 'WesAI Echo', data: { dialogueId: 'sage_intro', dialogue: ["The Gateway to the East is open."] } },
      { x: 8, y: 5, type: InteractableType.ENEMY, id: 'enemy_glitch_01', name: 'Glitch Sentinel', data: { hp: 50, maxHp: 50, attack: 8, xpReward: 25, creditsReward: 42 } },
      { x: 10, y: 2, type: InteractableType.ZONE_GATE, id: 'gate_to_02', name: 'Sector Link -> 02', data: { targetZoneId: 'sector-02', targetZoneName: 'Sector-02: The Archives', targetPosition: { x: 1, y: 5 }, targetFacing: Direction.RIGHT } }
    ]
  },
  'sector-02': {
    id: 'sector-02',
    name: 'Sector-02: The Archives',
    layout: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', '.', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', 'W', '.', 'W', 'W', '.', 'W', 'W', 'W', '.', 'W'],
      ['W', '.', 'W', '.', '.', '.', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', 'W', '.', '.', '.', '.', '.', 'W', 'W', '.', 'W'],
      ['W', 'G', '.', '.', '.', 'W', '.', '.', 'W', '.', '.', 'W'], // G is Gate back
      ['W', '.', '.', '.', '.', 'W', '.', '.', 'W', '.', '.', 'W'],
      ['W', '.', 'W', 'W', 'W', 'W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
    ],
    entities: [
      { x: 1, y: 5, type: InteractableType.ZONE_GATE, id: 'gate_to_01', name: 'Sector Link <- 01', data: { targetZoneId: 'sector-01', targetZoneName: 'Sector-01: Awakening', targetPosition: { x: 10, y: 2 }, targetFacing: Direction.LEFT } },
      { x: 10, y: 1, type: InteractableType.ITEM, id: 'chest_archive', name: 'Archive Cache', data: { itemReward: SAMPLE_ITEMS.DATA_CHIP, isHidden: true } },
      { x: 8, y: 6, type: InteractableType.ENEMY, id: 'enemy_firewall', name: 'Firewall Daemon', data: { hp: 80, maxHp: 80, attack: 12, xpReward: 50, creditsReward: 100 } }
    ]
  }
};

// Helper to parse the layout grid into Tile objects
export const loadZoneData = (zoneId: string): Tile[] => {
  const config = ZONE_DB[zoneId] || ZONE_DB['sector-01'];
  const tiles: Tile[] = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const char = config.layout[y][x];
      let type = TileType.EMPTY;
      if (char === 'W') type = TileType.WALL;
      if (char === '~') type = TileType.WATER;
      
      // Find entity at this position
      const entity = config.entities.find(e => e.x === x && e.y === y);
      let interactable = undefined;

      if (entity) {
        interactable = {
          type: entity.type,
          id: entity.id,
          name: entity.name,
          isHidden: entity.data?.isHidden || false,
          dialogue: entity.data?.dialogue,
          dialogueId: entity.data?.dialogueId, // Load complex dialogue ID
          itemReward: entity.data?.itemReward,
          combatStats: entity.type === InteractableType.ENEMY ? entity.data : undefined,
          transition: entity.type === InteractableType.ZONE_GATE ? entity.data : undefined,
        };
      }

      tiles.push({
        id: `z_${zoneId}_${x}_${y}`,
        x,
        y,
        type,
        interactable,
        isRevealed: false,
      });
    }
  }

  return tiles;
};
