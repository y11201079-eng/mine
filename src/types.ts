export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

export interface CellData {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
  row: number;
  col: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
