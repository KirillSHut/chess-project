import { useState } from 'react';
import { AiVsAiSetupMenu } from './AiVsAiSetupMenu.jsx';
import { BotDifficultyMenu } from './BotDifficultyMenu.jsx';
import { GameScreen } from './GameScreen.jsx';
import { MainMenu } from './MainMenu.jsx';
import { MultiplayerScreen } from './MultiplayerScreen.jsx';

const screens = {
  MAIN: 'main',
  BOT_DIFFICULTY: 'botDifficulty',
  AI_VS_AI_SETUP: 'aiVsAiSetup',
  MULTIPLAYER: 'multiplayer',
  GAME: 'game',
};

const localBotGame = {
  mode: 'human-vs-bot',
  playerSide: 'white',
  botDifficulties: {
    black: 'random',
  },
};

export function App() {
  const [screen, setScreen] = useState(screens.MAIN);
  const [gameConfig, setGameConfig] = useState(null);

  const startBotGame = (selectedDifficulty) => {
    setGameConfig({
      ...localBotGame,
      botDifficulties: {
        black: selectedDifficulty,
      },
    });
    setScreen(screens.GAME);
  };

  const startAiVsAiGame = (botDifficulties) => {
    setGameConfig({
      mode: 'ai-vs-ai',
      playerSide: null,
      botDifficulties,
    });
    setScreen(screens.GAME);
  };

  const startMultiplayerGame = (session) => {
    setGameConfig(session);
    setScreen(screens.GAME);
  };

  if (screen === screens.GAME) {
    return (
      <GameScreen
        mode={gameConfig.mode}
        roomId={gameConfig.roomId}
        playerSide={gameConfig.playerSide}
        botDifficulties={gameConfig.botDifficulties}
        onBackToMenu={() => setScreen(screens.MAIN)}
      />
    );
  }

  return (
    <main className="app-shell">
      {screen === screens.MAIN && (
        <MainMenu
          onPlayVsBot={() => setScreen(screens.BOT_DIFFICULTY)}
          onAiVsAi={() => setScreen(screens.AI_VS_AI_SETUP)}
          onMultiplayer={() => setScreen(screens.MULTIPLAYER)}
        />
      )}

      {screen === screens.BOT_DIFFICULTY && (
        <BotDifficultyMenu
          onBack={() => setScreen(screens.MAIN)}
          onSelectDifficulty={startBotGame}
        />
      )}

      {screen === screens.AI_VS_AI_SETUP && (
        <AiVsAiSetupMenu onBack={() => setScreen(screens.MAIN)} onStart={startAiVsAiGame} />
      )}

      {screen === screens.MULTIPLAYER && (
        <MultiplayerScreen
          onBack={() => setScreen(screens.MAIN)}
          onGameStart={startMultiplayerGame}
        />
      )}
    </main>
  );
}
