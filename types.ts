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
  level: number;
  xp: number;
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
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'COMBAT' | 'DIALOGUE' | 'SYSTEM';
}
