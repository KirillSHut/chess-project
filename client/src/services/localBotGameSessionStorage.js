import { ChessEngine } from '../../../shared/chess/ChessEngine.js';

const LOCAL_BOT_GAME_SESSION_KEY = 'localBotGameSession';

export function saveLocalBotGameSession(session) {
  if (!isValidSession(session)) return;

  getStorage()?.setItem(LOCAL_BOT_GAME_SESSION_KEY, JSON.stringify(session));
}

export function getLocalBotGameSession() {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const rawSession = storage.getItem(LOCAL_BOT_GAME_SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    if (!isValidSession(session)) {
      clearLocalBotGameSession();
      return null;
    }

    return session;
  } catch {
    clearLocalBotGameSession();
    return null;
  }
}

export function clearLocalBotGameSession() {
  getStorage()?.removeItem(LOCAL_BOT_GAME_SESSION_KEY);
}

function getStorage() {
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function isValidSession(session) {
  if (
    !(
      session?.mode === 'human-vs-bot' &&
      (session.playerSide === 'white' || session.playerSide === 'black') &&
      (session.botSide === 'white' || session.botSide === 'black') &&
      session.playerSide !== session.botSide &&
      typeof session.botDifficulty === 'string' &&
      session.engineSnapshot &&
      Array.isArray(session.engineSnapshot.cells) &&
      (session.engineSnapshot.activeSide === 'white' ||
        session.engineSnapshot.activeSide === 'black')
    )
  ) {
    return false;
  }

  const validationEngine = new ChessEngine();
  return validationEngine.loadSnapshot(session.engineSnapshot).success;
}
