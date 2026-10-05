import { useState } from 'react';
import { DIFFICULTY } from './Game';
import { viewTransition } from './transition';
import './Menu.css';

function Menu({ settings, onStart }) {
  const [view, setView] = useState('main'); // 'main' | 'ai' | 'color' | 'pvp' | 'rules'
  const [difficulty, setDifficulty] = useState(settings.difficulty);
  const [humanColor, setHumanColor] = useState(settings.humanColor);
  const [player1, setPlayer1] = useState(settings.pvpNames.red);
  const [player2, setPlayer2] = useState(settings.pvpNames.yellow);

  // Fade between menu screens.
  const go = (next) => viewTransition(() => setView(next));

  function startAI() {
    onStart({ mode: 'ai', difficulty, humanColor });
  }

  function startPvP(e) {
    e.preventDefault();
    onStart({
      mode: 'pvp',
      pvpNames: { red: player1.trim() || 'Red', yellow: player2.trim() || 'Yellow' },
    });
  }

  return (
    <main className="menu">
      <h1 className="menu-title">
        Connect <span className="four">4</span>
      </h1>

      <div className="menu-card" key={view}>
        {view === 'main' && (
          <>
            <button className="menu-btn" onClick={() => go('ai')}>
              1 Player
            </button>
            <button className="menu-btn" onClick={() => go('pvp')}>
              2 Players
            </button>
            <button className="menu-btn" onClick={() => go('rules')}>
              How to play
            </button>
          </>
        )}

        {view === 'ai' && (
          <>
            <h2>Choose difficulty</h2>
            <div className="difficulty">
              {Object.keys(DIFFICULTY).map((d) => (
                <button
                  key={d}
                  className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <button className="menu-btn primary" onClick={() => go('color')}>
              Continue
            </button>
            <button className="link" onClick={() => go('main')}>
              ← Back
            </button>
          </>
        )}

        {view === 'color' && (
          <>
            <h2>Choose your color</h2>
            <div className="color-pick">
              {['red', 'yellow'].map((c) => (
                <button
                  key={c}
                  className={`color-btn ${c} ${humanColor === c ? 'active' : ''}`}
                  onClick={() => setHumanColor(c)}
                  aria-pressed={humanColor === c}
                >
                  <span className="swatch" />
                  {c === 'red' ? 'Red' : 'Yellow'}
                </button>
              ))}
            </div>
            <p className="hint">Next, spin the wheel to see who goes first.</p>
            <button className="menu-btn primary" onClick={startAI}>
              Continue
            </button>
            <button className="link" onClick={() => go('ai')}>
              ← Back
            </button>
          </>
        )}

        {view === 'pvp' && (
          <form onSubmit={startPvP}>
            <h2>Player names</h2>
            <label className="name-field red">
              <span className="dot" />
              <input value={player1} onChange={(e) => setPlayer1(e.target.value)} maxLength={16} placeholder="Red" />
            </label>
            <label className="name-field yellow">
              <span className="dot" />
              <input
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                maxLength={16}
                placeholder="Yellow"
              />
            </label>
            <button type="submit" className="menu-btn primary">
              Continue
            </button>
            <button type="button" className="link" onClick={() => go('main')}>
              ← Back
            </button>
          </form>
        )}

        {view === 'rules' && (
          <>
            <h2>How to play</h2>
            <ol className="rules">
              <li>Players take turns dropping a piece into one of the seven columns.</li>
              <li>The piece falls to the lowest empty spot in that column.</li>
              <li>Get four of your pieces in a row horizontally, vertically or diagonally to win.</li>
              <li>If the board fills up with no four in a row, the game is a draw.</li>
            </ol>
            <button className="menu-btn primary" onClick={() => go('main')}>
              Got it
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default Menu;
