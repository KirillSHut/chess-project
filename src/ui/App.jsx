import { useState } from 'react';
import { BotDifficultyMenu } from './BotDifficultyMenu.jsx';
import { GameScreen } from './GameScreen.jsx';
import { MainMenu } from './MainMenu.jsx';

const screens = {
  MAIN: 'main',
  BOT_DIFFICULTY: 'botDifficulty',
  MULTIPLAYER: 'multiplayer',
  GAME: 'game',
};

const localBotGame = {
  playerSide: 'white',
  botSide: 'black',
};

export function App() {
  const [screen, setScreen] = useState(screens.MAIN);
  const [difficulty, setDifficulty] = useState(null);

  const startBotGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setScreen(screens.GAME);
  };

  if (screen === screens.GAME) {
    return (
      <GameScreen
        difficulty={difficulty}
        playerSide={localBotGame.playerSide}
        botSide={localBotGame.botSide}
        onBackToMenu={() => setScreen(screens.MAIN)}
      />
    );
  }

  return (
    <main className="app-shell">
      {screen === screens.MAIN && (
        <MainMenu
          onPlayVsBot={() => setScreen(screens.BOT_DIFFICULTY)}
          onMultiplayer={() => setScreen(screens.MULTIPLAYER)}
        />
      )}

      {screen === screens.BOT_DIFFICULTY && (
        <BotDifficultyMenu
          onBack={() => setScreen(screens.MAIN)}
          onSelectDifficulty={startBotGame}
        />
      )}

      {screen === screens.MULTIPLAYER && (
        <section className="menu-panel" aria-labelledby="multiplayer-title">
          <p className="menu-kicker">Multiplayer</p>
          <h1 id="multiplayer-title">Coming soon</h1>
          <p className="menu-copy">
            Online play will arrive as a separate feature so the local chess foundation can stay
            stable.
          </p>
          <button
            className="menu-button menu-button-secondary"
            type="button"
            onClick={() => setScreen(screens.MAIN)}
          >
            Back to menu
          </button>
        </section>
      )}
    </main>
  );
}
