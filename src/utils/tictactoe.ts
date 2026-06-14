export type Cell = 'X' | 'O' | '';
export type Board = Cell[];

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWinner(board: Board): Cell | 'draw' | '' {
  for (const [a, b, c] of WINS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every((c) => c)) return 'draw';
  return '';
}

export function bestMove(board: Board, ai: 'X' | 'O'): number {
  const ranked = rankMoves(board, ai);
  return ranked[0]?.move ?? -1;
}

/** Ход мясника: иногда ошибается, но забирает победу и блокирует твою */
export function butcherMove(board: Board, failCount: number): number {
  const ranked = rankMoves(board, 'X');
  if (ranked.length === 0) return -1;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const winTry = [...board];
    winTry[i] = 'X';
    if (checkWinner(winTry) === 'X') return i;
  }

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const blockTry = [...board];
    blockTry[i] = 'O';
    if (checkWinner(blockTry) === 'O') return i;
  }

  const blunderChance = Math.min(0.72, 0.38 + failCount * 0.1);
  if (ranked.length > 1 && Math.random() < blunderChance) {
    const weak = ranked.slice(1);
    return weak[Math.floor(Math.random() * weak.length)].move;
  }

  return ranked[0].move;
}

export function rankMoves(board: Board, ai: 'X' | 'O'): { move: number; score: number }[] {
  const human = ai === 'X' ? 'O' : 'X';
  const out: { move: number; score: number }[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = ai;
    out.push({ move: i, score: minimax(next, false, ai, human) });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

function minimax(board: Board, isAi: boolean, ai: 'X' | 'O', human: 'X' | 'O'): number {
  const w = checkWinner(board);
  if (w === ai) return 10;
  if (w === human) return -10;
  if (w === 'draw') return 0;

  if (isAi) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const next = [...board];
      next[i] = ai;
      best = Math.max(best, minimax(next, false, ai, human));
    }
    return best;
  }

  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = human;
    best = Math.min(best, minimax(next, true, ai, human));
  }
  return best;
}
