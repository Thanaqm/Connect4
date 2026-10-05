export const ROWS = 6;
export const COLS = 7;
export const EMPTY = null;

export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

// Returns the row a piece would land in, or -1 if the column is full.
export function getDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}

export function dropPiece(board, col, player) {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  const next = board.map((r) => r.slice());
  next[row][col] = player;
  return { board: next, row };
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

// Returns the winning cells as [row, col] pairs, or null.
export function findWin(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p === EMPTY) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const cells = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { player: p, cells };
      }
    }
  }
  return null;
}

export function isFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}

// ---------- AI (minimax with alpha-beta pruning) ----------

const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];

function scoreWindow(window, me, opp) {
  const mine = window.filter((c) => c === me).length;
  const theirs = window.filter((c) => c === opp).length;
  const empty = window.filter((c) => c === EMPTY).length;
  if (mine === 4) return 1000;
  if (mine === 3 && empty === 1) return 5;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -4;
  return 0;
}

function evaluate(board, me, opp) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === me) score += 3;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRECTIONS) {
        const endR = r + dr * 3;
        const endC = c + dc * 3;
        if (endR < 0 || endR >= ROWS || endC < 0 || endC >= COLS) continue;
        const window = [0, 1, 2, 3].map((i) => board[r + dr * i][c + dc * i]);
        score += scoreWindow(window, me, opp);
      }
    }
  }
  return score;
}

function minimax(board, depth, alpha, beta, maximizing, me, opp) {
  const win = findWin(board);
  if (win) return win.player === me ? 100000 + depth : -100000 - depth;
  if (isFull(board)) return 0;
  if (depth === 0) return evaluate(board, me, opp);

  if (maximizing) {
    let best = -Infinity;
    for (const col of COLUMN_ORDER) {
      const res = dropPiece(board, col, me);
      if (!res) continue;
      best = Math.max(best, minimax(res.board, depth - 1, alpha, beta, false, me, opp));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of COLUMN_ORDER) {
      const res = dropPiece(board, col, opp);
      if (!res) continue;
      best = Math.min(best, minimax(res.board, depth - 1, alpha, beta, true, me, opp));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}

export function bestMove(board, me, opp, depth = 5) {
  let bestScore = -Infinity;
  let bestCol = COLUMN_ORDER.find((c) => getDropRow(board, c) !== -1);
  for (const col of COLUMN_ORDER) {
    const res = dropPiece(board, col, me);
    if (!res) continue;
    const score = minimax(res.board, depth - 1, -Infinity, Infinity, false, me, opp);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}
