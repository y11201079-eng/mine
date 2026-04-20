/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, Bomb, RefreshCw, Trophy, Skull, Clock, Settings2, HelpCircle } from 'lucide-react';
import { 
  DifficultyLevel, 
  DIFFICULTIES, 
  CellData, 
  GameStatus 
} from './types';

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = DIFFICULTIES[difficulty];

  const initializeGrid = useCallback((firstClick?: { row: number, col: number }) => {
    const { rows, cols, mines } = config;
    let newGrid: CellData[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0,
        row: r,
        col: c,
      }))
    );

    // Randomly place mines
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      
      // Avoid placing mine on first click or already placed mines
      if (!newGrid[r][c].isMine && !(firstClick && Math.abs(r - firstClick.row) <= 1 && Math.abs(c - firstClick.col) <= 1)) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborCount = count;
        }
      }
    }

    return newGrid;
  }, [config]);

  const startGame = useCallback(() => {
    setGrid(initializeGrid());
    setStatus('idle');
    setTimer(0);
    setFlagsUsed(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [initializeGrid]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const startTimer = () => {
    if (timerIntervalRef.current) return;
    timerIntervalRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const revealCell = (r: number, c: number) => {
    if (status === 'won' || status === 'lost' || grid[r][c].isFlagged || grid[r][c].isRevealed) return;

    let currentGrid = [...grid];
    let newStatus = status;

    if (status === 'idle') {
      currentGrid = initializeGrid({ row: r, col: c });
      newStatus = 'playing';
      startTimer();
    }

    const cell = currentGrid[r][c];

    if (cell.isMine) {
      // Game Over
      newStatus = 'lost';
      stopTimer();
      // Show all mines
      currentGrid = currentGrid.map(row => row.map(cell => cell.isMine ? { ...cell, isRevealed: true } : cell));
    } else {
      // Standard reveal
      const revealRecursive = (row: number, col: number) => {
        if (row < 0 || row >= config.rows || col < 0 || col >= config.cols || currentGrid[row][col].isRevealed || currentGrid[row][col].isFlagged) return;
        
        currentGrid[row][col] = { ...currentGrid[row][col], isRevealed: true };
        
        if (currentGrid[row][col].neighborCount === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              revealRecursive(row + dr, col + dc);
            }
          }
        }
      };
      
      revealRecursive(r, c);

      // Check win
      const revealedCount = currentGrid.flat().filter(c => c.isRevealed).length;
      if (revealedCount === config.rows * config.cols - config.mines) {
        newStatus = 'won';
        stopTimer();
        // Flag remaining mines
        currentGrid = currentGrid.map(row => row.map(cell => cell.isMine ? { ...cell, isFlagged: true } : cell));
        setFlagsUsed(config.mines);
      }
    }

    setGrid(currentGrid);
    setStatus(newStatus);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost' || grid[r][c].isRevealed) return;

    const newGrid = [...grid];
    const cell = newGrid[r][c];
    
    if (cell.isFlagged) {
      newGrid[r][c] = { ...cell, isFlagged: false };
      setFlagsUsed(f => f - 1);
    } else if (flagsUsed < config.mines) {
      newGrid[r][c] = { ...cell, isFlagged: true };
      setFlagsUsed(f => f + 1);
    }
    
    setGrid(newGrid);
  };

  const getNeighborColor = (count: number) => {
    const colors = [
      '',
      'text-blue-500',
      'text-green-500',
      'text-red-500',
      'text-purple-500',
      'text-yellow-600',
      'text-cyan-500',
      'text-black',
      'text-gray-500'
    ];
    return colors[count];
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans selection:bg-orange-100 p-4 md:p-8 flex flex-col items-center text-center">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Bomb className="text-white w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">Modern Mines</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Minimal Strategy</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={startGame}
            className="p-2 hover:bg-orange-50 rounded-full transition-colors text-orange-500"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Flag className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Mines</span>
          </div>
          <span className="text-2xl font-mono font-bold">{config.mines - flagsUsed}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center">
          <button 
            onClick={startGame}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              status === 'won' ? 'bg-green-100 text-green-600' : 
              status === 'lost' ? 'bg-red-100 text-red-600' : 
              'bg-orange-50 text-orange-500'
            }`}
          >
            {status === 'won' ? <Trophy className="w-8 h-8" /> : 
             status === 'lost' ? <Skull className="w-8 h-8" /> : 
             <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />}
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
          </div>
          <span className="text-2xl font-mono font-bold leading-none">{timer.toString().padStart(3, '0')}</span>
        </div>
      </div>

      {/* Difficulty Tabs */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full max-w-4xl overflow-hidden mb-6"
          >
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setDifficulty(level);
                    setShowSettings(false);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    difficulty === level ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="block text-[10px] opacity-60 font-normal">
                    {DIFFICULTIES[level].rows}×{DIFFICULTIES[level].cols} · {DIFFICULTIES[level].mines}M
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Container */}
      <div 
        className="relative bg-[#F3F2F1] p-3 rounded-3xl shadow-xl overflow-auto max-w-full"
        style={{
          border: '12px solid #F3F2F1',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <div 
          className="grid gap-1.5"
          style={{ 
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            width: difficulty === 'hard' ? 'fit-content' : 'auto'
          }}
        >
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <motion.button
                key={`${r}-${c}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                className={`
                  w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md font-bold text-sm md:text-base border border-transparent shadow-[0_2px_0_rgba(0,0,0,0.1)] transition-all
                  ${cell.isRevealed 
                    ? 'bg-white shadow-none text-gray-800' 
                    : 'bg-[#E0DFDE] hover:bg-[#D4D2D0] cursor-pointer'
                  }
                  ${cell.isRevealed && cell.isMine ? '!bg-red-500 !text-white' : ''}
                  ${cell.isFlagged && !cell.isRevealed ? '!bg-orange-100' : ''}
                `}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    <Bomb className="w-5 h-5" />
                  ) : (
                    cell.neighborCount > 0 ? (
                      <span className={getNeighborColor(cell.neighborCount)}>
                        {cell.neighborCount}
                      </span>
                    ) : null
                  )
                ) : (
                  cell.isFlagged ? (
                    <Flag className="w-4 h-4 text-orange-500 fill-orange-500" />
                  ) : null
                )}
              </motion.button>
            ))
          ))}
        </div>

        {/* Overlay for Win/Loss */}
        <AnimatePresence>
          {(status === 'won' || status === 'lost') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`px-8 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 border pointer-events-auto ${
                  status === 'won' ? 'bg-white border-green-100' : 'bg-white border-red-100'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                  status === 'won' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {status === 'won' ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {status === 'won' ? 'Mission Success' : 'Deactivated'}
                </h2>
                <p className="text-gray-500 text-sm font-medium mb-4">
                  {status === 'won' ? `Time: ${timer}s · Flags: ${flagsUsed}` : 'Better luck next time'}
                </p>
                <button 
                  onClick={startGame}
                  className="bg-[#1D1D1F] text-white px-6 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Play Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How to play */}
      <div className="w-full max-w-4xl mt-12 grid md:grid-cols-2 gap-8 items-start text-left">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
          <div className="flex items-center gap-2 mb-4 text-[#1D1D1F]">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold">How to Play</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-500 leading-relaxed">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Click a square to reveal it. Numbers show how many mines are adjacent.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Right-click or long-press to place a flag on suspected mines.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Clear the entire grid without detonating any mines to win!</span>
            </li>
          </ul>
        </div>

        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100/50">
          <h3 className="font-bold text-orange-900 mb-2">Pro Tip</h3>
          <p className="text-sm text-orange-800/70 leading-relaxed">
            Your first click is always safe and will never be a mine. In fact, we make sure it opens a decent-sized area to get you started!
          </p>
        </div>
      </div>

      <footer className="mt-12 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-8">
        &copy; 2026 Modern Strategy Lab
      </footer>
    </div>
  );
}
