import { useState } from 'react';

const difficulties = [
  { label: 'Random', value: 'random' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

export function AiVsAiSetupMenu({ onBack, onStart }) {
  const [whiteDifficulty, setWhiteDifficulty] = useState('random');
  const [blackDifficulty, setBlackDifficulty] = useState('random');

  return (
    <section className="menu-panel" aria-labelledby="ai-vs-ai-title">
      <p className="menu-kicker">AI vs AI</p>
      <h1 id="ai-vs-ai-title">Set bot match</h1>
      <p className="menu-copy">Choose the difficulty for each side, then let the board speak.</p>

      <div className="ai-setup-grid">
        <label className="ai-setup-field">
          <span>White bot</span>
          <select
            value={whiteDifficulty}
            onChange={(event) => setWhiteDifficulty(event.target.value)}
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ai-setup-field">
          <span>Black bot</span>
          <select
            value={blackDifficulty}
            onChange={(event) => setBlackDifficulty(event.target.value)}
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="menu-actions">
        <button
          className="menu-button menu-button-primary"
          type="button"
          onClick={() => onStart({ white: whiteDifficulty, black: blackDifficulty })}
        >
          Start Match
        </button>
        <button className="menu-button menu-button-secondary" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}
