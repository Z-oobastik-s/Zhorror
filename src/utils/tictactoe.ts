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
  const human = ai === 'X' ? 'O' : 'X';
  let best = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = ai;
    const score = minimax(next, false, ai, human);
    if (score > best) {
      best = score;
      move = i;
    }
  }
  return move;
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
