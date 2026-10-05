import { useEffect, useState } from 'react';
import Game from './Game';
import Menu from './Menu';
import ThemeToggle from './ThemeToggle';
import Wheel from './Wheel';
import { viewTransition } from './transition';

function initialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable; fall back to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'wheel' | 'game'
  const [theme, setTheme] = useState(initialTheme);
  const [settings, setSettings] = useState({
    mode: 'ai',
    difficulty: 'medium',
    humanColor: 'red', // the player's colour vs the CPU
    first: 'red', // colour that moves first, decided by the wheel
    pvpNames: { red: '', yellow: '' },
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore; the theme just won't be remembered.
    }
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Dark falls down from the top like a curtain; light rises up from the bottom.
    document.documentElement.dataset.themeDir = next === 'dark' ? 'down' : 'up';
    viewTransition(() => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
    }, 'theme');
  }

  // Menu choices first, then the wheel decides who starts.
  // Every screen change fades between pages.
  function goTo(next, update) {
    viewTransition(() => {
      update?.();
      setScreen(next);
    });
  }

  function chooseSettings(choice) {
    goTo('wheel', () => setSettings((s) => ({ ...s, ...choice })));
  }

  function startGame(first) {
    goTo('game', () => setSettings((s) => ({ ...s, first })));
  }

  const { mode, humanColor } = settings;
  const cpuColor = humanColor === 'red' ? 'yellow' : 'red';
  const names = mode === 'ai' ? { [humanColor]: 'You', [cpuColor]: 'CPU' } : settings.pvpNames;
  const floatingToggle = <ThemeToggle theme={theme} onToggle={toggleTheme} className="floating" />;

  if (screen === 'menu') {
    return (
      <>
        {floatingToggle}
        <Menu settings={settings} onStart={chooseSettings} />
      </>
    );
  }

  if (screen === 'wheel') {
    const titles = Object.fromEntries(
      ['red', 'yellow'].map((c) => [c, names[c] === 'You' ? 'You go first' : `${names[c]} goes first`]),
    );
    return (
      <>
        {floatingToggle}
        <Wheel labels={names} titles={titles} onStart={startGame} onBack={() => goTo('menu')} />
      </>
    );
  }

  return (
    <Game
      mode={mode}
      difficulty={settings.difficulty}
      humanColor={humanColor}
      first={settings.first}
      names={names}
      onExit={() => goTo('menu')}
      themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
    />
  );
}

export default App;
