import { useEffect, useRef, useState } from 'react';
import './Wheel.css';

// Spin-the-wheel that decides who goes first. Ported from the Tha-Da capabilities wheel.

const SLICE_COUNT = 8;
const SPIN_MS = 5200;
const WINDUP_MS = 450;
const WINDUP_DEG = 22;
const BULB_COUNT = 24;
const CONFETTI_COUNT = 28;
const SIZE = 320;
const R = SIZE / 2;

// Angle 0 is 12 o'clock, increasing clockwise.
function point(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180;
  return [R + radius * Math.sin(a), R - radius * Math.cos(a)];
}

function slicePath(start, end) {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${R} ${R} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Ease out hard so the wheel crawls through the last few slices.
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// Rotation progress at time `t` (0..1): a short backwards wind-up, then the spin.
function spinAngle(t, total, windupFrac) {
  if (t < windupFrac) {
    return -WINDUP_DEG * Math.sin((t / windupFrac) * (Math.PI / 2));
  }
  const p = easeOutQuart((t - windupFrac) / (1 - windupFrac));
  return -WINDUP_DEG + (total + WINDUP_DEG) * p;
}

function makeConfetti() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 110 + Math.random() * 90;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      rot: Math.random() * 720 - 360,
      color: ['var(--red)', 'var(--yellow)', 'var(--accent)', 'var(--text)'][i % 4],
      delay: Math.random() * 120,
    };
  });
}

function randomInt(max) {
  if (window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * labels: slice text per colour, e.g. { red: 'You', yellow: 'CPU' }
 * titles: result headline per colour, e.g. { red: 'You go first', yellow: 'CPU goes first' }
 */
function Wheel({ labels, titles, onStart, onBack }) {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null); // colour that goes first
  const [winIndex, setWinIndex] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [burstKey, setBurstKey] = useState(0);

  const wheelRef = useRef(null);
  const pointerRef = useRef(null);
  const rotationRef = useRef(0);
  const frameRef = useRef(null);

  const seg = 360 / SLICE_COUNT;
  const slices = Array.from({ length: SLICE_COUNT }, (_, i) => (i % 2 === 0 ? 'red' : 'yellow'));

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const applyRotation = (deg, blur = 0) => {
    const el = wheelRef.current;
    if (!el) return;
    el.style.transform = `rotate(${deg}deg)`;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  };

  const tickPointer = () => {
    const el = pointerRef.current;
    if (!el) return;
    el.classList.remove('wh-pointer-tick');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('wh-pointer-tick');
  };

  const finish = (index) => {
    setSpinning(false);
    setWinIndex(index);
    setWinner(slices[index]);
    setConfetti(makeConfetti());
    setBurstKey((k) => k + 1);
  };

  const spin = () => {
    if (spinning || winner) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const index = randomInt(SLICE_COUNT);
    // Land somewhere inside the slice, not always dead centre.
    const jitter = (randomInt(1000) / 1000 - 0.5) * seg * 0.7;
    const target = (360 - ((index + 0.5) * seg + jitter) + 360) % 360;
    const startDeg = rotationRef.current;
    const current = ((startDeg % 360) + 360) % 360;
    const extraSpins = prefersReducedMotion ? 0 : 360 * (5 + randomInt(3));
    const total = extraSpins + ((target - current + 360) % 360);

    if (prefersReducedMotion) {
      rotationRef.current = startDeg + total;
      applyRotation(rotationRef.current);
      finish(index);
      return;
    }

    setSpinning(true);
    const duration = SPIN_MS + WINDUP_MS;
    const windupFrac = WINDUP_MS / duration;
    const t0 = performance.now();
    let lastDeg = startDeg;
    let lastSlice = Math.floor(startDeg / seg);

    const frame = (now) => {
      const t = Math.min((now - t0) / duration, 1);
      const deg = startDeg + spinAngle(t, total, windupFrac);

      // Motion blur scales with how far the wheel moved this frame.
      const speed = Math.abs(deg - lastDeg);
      applyRotation(deg, Math.min(speed / 12, 2.5));

      const slice = Math.floor(deg / seg);
      if (slice !== lastSlice) {
        tickPointer();
        lastSlice = slice;
      }

      lastDeg = deg;
      rotationRef.current = deg;

      if (t < 1) {
        frameRef.current = requestAnimationFrame(frame);
      } else {
        applyRotation(deg);
        finish(index);
      }
    };

    frameRef.current = requestAnimationFrame(frame);
  };

  return (
    <main className="wheel-page">
      <h2 className="wheel-heading">Who goes first?</h2>

      <div className={`wh-wrap ${spinning ? 'is-spinning' : ''} ${winner ? 'has-result' : ''}`}>
        <svg className="wh-bulbs" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="48" className="wh-rim" />
          {Array.from({ length: BULB_COUNT }, (_, i) => {
            const a = (i / BULB_COUNT) * Math.PI * 2;
            return (
              <circle
                key={i}
                className="wh-bulb"
                cx={50 + 48 * Math.sin(a)}
                cy={50 - 48 * Math.cos(a)}
                r="1.4"
                style={{ '--i': i }}
              />
            );
          })}
        </svg>

        <div className="wh-pointer-holder" aria-hidden="true">
          <div className="wh-pointer" ref={pointerRef} />
        </div>

        <svg
          ref={wheelRef}
          className="wh-wheel"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Wheel deciding who goes first"
        >
          {slices.map((player, i) => {
            const start = i * seg;
            const mid = start + seg / 2;
            const [tx, ty] = point(mid, R * 0.62);
            return (
              <g
                key={i}
                className={`wh-slice ${player} ${winIndex === null ? '' : winIndex === i ? 'wh-slice-win' : 'wh-slice-dim'}`}
              >
                <path d={slicePath(start, start + seg)} strokeWidth="2" />
                <text
                  x={tx}
                  y={ty}
                  className="wh-slice-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid - 90} ${tx} ${ty})`}
                >
                  {labels[player].toUpperCase()}
                </text>
              </g>
            );
          })}
          <circle className="wh-hub" cx={R} cy={R} r={R * 0.12} strokeWidth="3" />
        </svg>

        <div className="wh-confetti" key={burstKey} aria-hidden="true">
          {confetti.map((c, i) => (
            <span
              key={i}
              style={{
                '--dx': `${c.dx}px`,
                '--dy': `${c.dy}px`,
                '--rot': `${c.rot}deg`,
                background: c.color,
                animationDelay: `${c.delay}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="wh-panel" aria-live="polite">
        {winner ? (
          <>
            <h3 className={`wh-result ${winner}`}>{titles[winner]}</h3>
            <div className="menu-card">
              <button className="menu-btn primary" onClick={() => onStart(winner)} autoFocus>
                Start game
              </button>
            </div>
          </>
        ) : (
          <button className={`wh-spin ${spinning ? '' : 'wh-spin-idle'}`} onClick={spin} disabled={spinning}>
            {spinning ? 'Spinning…' : 'Spin the wheel'}
          </button>
        )}
        <button className="link" onClick={onBack} disabled={spinning}>
          ← Back
        </button>
      </div>
    </main>
  );
}

export default Wheel;
