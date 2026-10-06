import { bestMove } from './connect4';

// Runs the CPU search off the main thread so animations never stall while it thinks.
self.onmessage = (e) => {
  const { id, board, me, opp, depth } = e.data;
  self.postMessage({ id, col: bestMove(board, me, opp, depth) });
};
