
// --- Core Data Structures ---

export type Position = {
  x: number;
  y: number;
};

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// --- World Entities ---

export enum TileType {
  EMPTY = 'EMPTY',
  WALL = 'WALL',
  DOOR = 'DOOR',
  WATER = 'WATER',
  VOID = 'VOID', // Represents the edge of reality
}

export enum InteractableType {
  NONE = 'NONE',
  NPC = 'NPC',
  ITEM = 'ITEM',
  SHRINE = 'SHRINE',
  ENEMY = 'ENEMY'
}

export interface EnemyStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  type: TileType;
  interactable?: {
    type: InteractableType;
    id: string;
    name: string;
    isHidden?: boolean; // Requires 'Shift' to see
    dialogue?: string[];
    itemReward?: Item;
    combatStats?: EnemyStats;
  };
  isRevealed: boolean;
}

// --- Player & State ---

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'KEY' | 'CONSUMABLE' | 'ARTIFACT';
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number; // Ether Capacity
  maxMp: number;
  attack: number;
  defense: number;
  level: number;
  xp: number;
}

export interface ActiveEnemy {
  id: string; // To match with tile id for removal
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  xpReward: number;
}

export interface GameState {
  playerPos: Position;
  playerFacing: Direction;
  stats: PlayerStats;
  inventory: Item[];
  currentZone: string;
  isShiftActive: boolean; // The core mechanic
  gameLog: LogEntry[];
  isCombatActive: boolean;
  activeEnemy: ActiveEnemy | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'COMBAT' | 'DIALOGUE' | 'SYSTEM';
}
