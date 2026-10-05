import { useEffect, useState } from 'react';
import { COLS, ROWS, bestMove, createBoard, dropPiece, findWin, getDropRow, isFull } from './connect4';
import TurnBanner, { BANNER_MS, WIN_BANNER_MS } from './TurnBanner';
import './App.css';
import './Menu.css';

const RED = 'red';
const YELLOW = 'yellow';
export const DIFFICULTY = { easy: 2, medium: 4, hard: 6 };

function Game({ mode, difficulty, humanColor, first, names, onExit, themeToggle }) {
  const cpuColor = humanColor === RED ? YELLOW : RED;
  const [board, setBoard] = useState(createBoard);
  const [current, setCurrent] = useState(first);
  const [history, setHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [hoverCol, setHoverCol] = useState(3);
  const [hovering, setHovering] = useState(false);
  const [scores, setScores] = useState({ red: 0, yellow: 0, draw: 0 });
  const [overReady, setOverReady] = useState(false); // game-over screen has faded in
  // Open with a banner announcing who starts.
  const [banner, setBanner] = useState({ player: first, label: first.toUpperCase(), duration: BANNER_MS, id: 1 }); // { player, label, duration, id } while a banner is showing

  const win = findWin(board);
  const draw = !win && isFull(board);
  const gameOver = Boolean(win || draw);
  const aiTurn = mode === 'ai' && current === cpuColor && !gameOver;
  const winCells = new Set(win?.cells.map(([r, c]) => `${r}-${c}`));

  function play(col) {
    if (gameOver) return;
    const res = dropPiece(board, col, current);
    if (!res) return;
    setHistory((h) => [...h, { board, current, lastMove }]);
    setBoard(res.board);
    setLastMove({ row: res.row, col });
    const next = current === RED ? YELLOW : RED;
    setCurrent(next);

    const result = findWin(res.board);
    if (result) {
      setScores((s) => ({ ...s, [result.player]: s[result.player] + 1 }));
      showBanner(result.player, `${result.player.toUpperCase()} WINS`, WIN_BANNER_MS);
    } else if (isFull(res.board)) {
      setScores((s) => ({ ...s, draw: s.draw + 1 }));
      setBanner(null);
    } else {
      showBanner(next, next.toUpperCase(), BANNER_MS);
    }
  }

  function showBanner(player, label, duration) {
    setBanner((b) => ({ player, label, duration, id: (b?.id ?? 0) + 1 }));
  }

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), banner.duration);
    return () => clearTimeout(id);
  }, [banner]);

  // Give players a moment to see the result before the glass game-over screen fades in.
  useEffect(() => {
    if (!gameOver) return;
    const id = setTimeout(() => setOverReady(true), 1400);
    return () => clearTimeout(id);
  }, [gameOver]);
  const showOver = gameOver && overReady;

  useEffect(() => {
    if (!aiTurn) return;
    // Let the turn banner play out before the CPU moves.
    const id = setTimeout(() => play(bestMove(board, cpuColor, humanColor, DIFFICULTY[difficulty])), BANNER_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTurn, board]);

  function handleClick(col) {
    if (aiTurn) return;
    play(col);
  }

  // When the CPU opens, its first move can't be undone (it would just replay it).
  const canUndo = history.length > (mode === 'ai' && first === cpuColor ? 1 : 0) && !aiTurn;

  function undo() {
    if (!canUndo) return;
    // In AI mode, undo back to the human's previous turn.
    const steps = mode === 'ai' && history.length >= 2 && current === humanColor ? 2 : 1;
    const target = history[history.length - steps];
    if (gameOver) {
      const key = win ? win.player : 'draw';
      setScores((s) => ({ ...s, [key]: s[key] - 1 }));
    }
    setBoard(target.board);
    setCurrent(target.current);
    setLastMove(target.lastMove);
    setHistory((h) => h.slice(0, h.length - steps));
    setBanner(null);
    setOverReady(false);
  }

  function newGame() {
    setBoard(createBoard());
    setCurrent(first);
    setHistory([]);
    setLastMove(null);
    showBanner(first, first.toUpperCase(), BANNER_MS);
    setOverReady(false);
  }

  // A win is announced by the banner, so the pill is hidden then.
  let status;
  if (draw) status = "It's a draw";
  else if (aiTurn) status = 'CPU is thinking';
  else status = `${names[current]}${mode === 'ai' ? 'r' : "'s"} turn`;

  const pillTone = draw ? 'neutral' : current;
  const round = scores.red + scores.yellow + scores.draw + (gameOver ? 0 : 1);
  const meta = [
    `Round ${round}`,
    mode === 'ai' ? `vs CPU · ${difficulty}` : '2 players',
    scores.draw > 0 && `${scores.draw} draw${scores.draw === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const showHover = hovering && !gameOver && !aiTurn;
  const previewRow = showHover ? getDropRow(board, hoverCol) : -1;

  return (
    <main className="app">
      <header className="topbar">
        <button className="back" onClick={onExit}>
          ← Menu
        </button>

        <div className="status-box">
          <span className="meta">{meta}</span>
          {!win && (
            <p className={`status-pill ${pillTone} ${aiTurn ? 'thinking' : ''}`} aria-live="polite">
              <span className="pill-dot" />
              {status}
              {aiTurn && (
                <span className="thinking-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </p>
          )}
        </div>

        <div className="actions">
          <button onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button className="primary" onClick={newGame}>
            New game
          </button>
          {themeToggle}
        </div>
      </header>

      <div className={`play-area ${showOver ? 'over' : ''}`}>
        {[RED, YELLOW].map((player) => (
          <aside
            key={player}
            className={`side ${player} ${current === player && !gameOver ? 'turn' : ''} ${win?.player === player ? 'winner' : ''}`}
          >
            <div className={`side-disc piece ${player}`} />
            <span className="side-name">{names[player]}</span>
            <strong className="side-score">{scores[player]}</strong>
          </aside>
        ))}

        <div className="board-area">
          <div
            className={`board turn-${current} ${aiTurn || gameOver ? 'locked' : ''}`}
            style={{ '--cols': COLS, '--rows': ROWS, '--hover-col': hoverCol }}
            onMouseLeave={() => setHovering(false)}
          >
            <div className={`piece ${current} hover-disc ${showHover ? 'visible' : ''} ${previewRow === -1 ? 'blocked' : ''}`} />
            {Array.from({ length: COLS }, (_, col) => (
              <button
                key={col}
                className={`column ${showHover && hoverCol === col && previewRow !== -1 ? 'hovered' : ''}`}
                style={hoverCol === col && previewRow !== -1 ? { '--land-row': previewRow } : undefined}
                aria-label={`Drop in column ${col + 1}`}
                onClick={() => handleClick(col)}
                onMouseEnter={() => {
                  setHoverCol(col);
                  setHovering(true);
                }}
                onFocus={() => {
                  setHoverCol(col);
                  setHovering(true);
                }}
                onBlur={() => setHovering(false)}
                disabled={gameOver || aiTurn || getDropRow(board, col) === -1}
              >
                {Array.from({ length: ROWS }, (_, row) => {
                  const cell = board[row][col];
                  const isLast = lastMove?.row === row && lastMove?.col === col;
                  const isWin = winCells.has(`${row}-${col}`);
                  return (
                    <div key={row} className={`cell ${cell ? '' : 'empty'}`}>
                      {cell && (
                        <div
                          className={`piece ${cell} ${isLast ? 'drop' : ''} ${isWin ? 'win' : ''} ${win && !isWin ? 'dim' : ''}`}
                          style={{ '--drop-rows': row + 1 }}
                        />
                      )}
                      {!cell && row === previewRow && hoverCol === col && <div className="landing" />}
                    </div>
                  );
                })}
              </button>
            ))}
          </div>
        </div>
        {showOver && (
          <div className={`game-over ${win ? win.player : 'draw'}`}>
            <div className="game-over-content">
              <h2>{win ? `${win.player === RED ? 'Red' : 'Yellow'} wins` : "It's a draw"}</h2>
              <p className="over-sub">
                Round {round} · {names.red} {scores.red} — {scores.yellow} {names.yellow}
              </p>
              <div className="menu-card">
                <button className="menu-btn primary" onClick={newGame} autoFocus>
                  Play again
                </button>
                <button className="menu-btn" onClick={onExit}>
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {banner && (
        <TurnBanner key={banner.id} player={banner.player} label={banner.label} duration={banner.duration} />
      )}
    </main>
  );
}

export default Game;
