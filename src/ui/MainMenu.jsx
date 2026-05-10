export function MainMenu({ onPlayVsBot, onMultiplayer }) {
  return (
    <section className="menu-panel" aria-labelledby="main-menu-title">
      <p className="menu-kicker">Chess Project</p>
      <h1 id="main-menu-title">Choose your game</h1>
      <p className="menu-copy">
        A quiet board, a clean position, and a bot that currently trusts chance.
      </p>

      <div className="menu-actions">
        <button className="menu-button menu-button-primary" type="button" onClick={onPlayVsBot}>
          Play vs Bot
        </button>
        <button className="menu-button menu-button-secondary" type="button" onClick={onMultiplayer}>
          Multiplayer
        </button>
      </div>
    </section>
  );
}
