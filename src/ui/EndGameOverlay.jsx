function getResultTitle(result, viewerSide) {
  if (result.isDraw || result.winner === null) {
    return 'Draw';
  }

  if (!viewerSide) {
    return `${result.winner[0].toUpperCase()}${result.winner.slice(1)} Wins`;
  }

  return result.winner === viewerSide ? 'You Win' : 'You Lose';
}

export function EndGameOverlay({ result, viewerSide, onRestart, onBackToMenu }) {
  return (
    <section className="end-game-overlay" aria-live="polite" aria-labelledby="end-game-title">
      <div className="end-game-panel">
        <p className="menu-kicker">{result.type}</p>
        <h1 id="end-game-title">{getResultTitle(result, viewerSide)}</h1>
        <div className="end-game-actions">
          <button className="menu-button menu-button-primary" type="button" onClick={onRestart}>
            Restart Game
          </button>
          <button
            className="menu-button menu-button-secondary"
            type="button"
            onClick={onBackToMenu}
          >
            Back To Menu
          </button>
        </div>
      </div>
    </section>
  );
}
