const difficulties = [
  { label: 'Random', available: true },
  { label: 'Easy', available: false },
  { label: 'Medium', available: false },
  { label: 'Hard', available: false },
];

export function BotDifficultyMenu({ onBack, onSelectRandom }) {
  return (
    <section className="menu-panel" aria-labelledby="difficulty-title">
      <p className="menu-kicker">Play vs Bot</p>
      <h1 id="difficulty-title">Select difficulty</h1>
      <p className="menu-copy">Only Random is available in the current implementation.</p>

      <div className="difficulty-list" aria-label="Bot difficulty">
        {difficulties.map((difficulty) => (
          <button
            className="menu-button difficulty-button"
            disabled={!difficulty.available}
            key={difficulty.label}
            type="button"
            onClick={difficulty.available ? onSelectRandom : undefined}
          >
            <span>{difficulty.label}</span>
            {!difficulty.available && <span className="difficulty-status">Not available yet</span>}
          </button>
        ))}
      </div>

      <button className="menu-button menu-button-secondary" type="button" onClick={onBack}>
        Back
      </button>
    </section>
  );
}
