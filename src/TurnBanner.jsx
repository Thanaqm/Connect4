import { useEffect, useRef, useState } from 'react';
import './TurnBanner.css';

export const BANNER_MS = 2000;
export const WIN_BANNER_MS = 4000;

const BAND = 38; // band thickness in px
const RADIUS = 28; // corner radius of the band's path

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// A band that wraps the whole page with the player's colour name running around it.
function TurnBanner({ player, label, duration = BANNER_MS }) {
  const { w, h } = useViewport();
  const i = BAND / 2;
  const r = RADIUS;
  const path = [
    `M ${i + r} ${i}`,
    `H ${w - i - r}`,
    `A ${r} ${r} 0 0 1 ${w - i} ${i + r}`,
    `V ${h - i - r}`,
    `A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}`,
    `H ${i + r}`,
    `A ${r} ${r} 0 0 1 ${i} ${h - i - r}`,
    `V ${i + r}`,
    `A ${r} ${r} 0 0 1 ${i + r} ${i}`,
    'Z',
  ].join(' ');
  const perimeter = 2 * (w - 2 * i) + 2 * (h - 2 * i) - 8 * r + 2 * Math.PI * r;

  // Repeat the label enough times to fill one lap; textLength stretches it to fit exactly.
  const unit = `${label}   •   `;
  const approxUnitWidth = unit.length * 15;
  const count = Math.max(1, Math.round(perimeter / approxUnitWidth));
  const text = unit.repeat(count);

  // Two copies one lap apart, both sliding forward, make a seamless loop.
  const pathRefs = useRef([]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // ease in-out
      const offset = eased * perimeter;
      pathRefs.current.forEach((el, k) => el?.setAttribute('startOffset', offset - k * perimeter));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [perimeter, duration]);

  return (
    <div className={`turn-banner ${player}`} style={{ animationDuration: `${duration}ms` }} aria-hidden="true">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <path id="turn-banner-path" d={path} />
        </defs>
        <use href="#turn-banner-path" className="band" strokeWidth={BAND} />
        {[0, 1].map((k) => (
          <text key={k} className="band-text" dominantBaseline="central">
            <textPath
              ref={(el) => (pathRefs.current[k] = el)}
              href="#turn-banner-path"
              startOffset={-k * perimeter}
              textLength={perimeter}
              lengthAdjust="spacing"
            >
              {text}
            </textPath>
          </text>
        ))}
      </svg>
    </div>
  );
}

export default TurnBanner;
