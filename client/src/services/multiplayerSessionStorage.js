const MULTIPLAYER_SESSION_KEY = 'multiplayerSession';

export function saveMultiplayerSession({ roomId, playerSide }) {
  if (!roomId || !playerSide) return;

  window.localStorage.setItem(
    MULTIPLAYER_SESSION_KEY,
    JSON.stringify({
      roomId,
      playerSide,
    }),
  );
}

export function getMultiplayerSession() {
  try {
    const rawSession = window.localStorage.getItem(MULTIPLAYER_SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    if (!session?.roomId || (session.playerSide !== 'white' && session.playerSide !== 'black')) {
      clearMultiplayerSession();
      return null;
    }

    return {
      roomId: session.roomId,
      playerSide: session.playerSide,
    };
  } catch {
    clearMultiplayerSession();
    return null;
  }
}

export function clearMultiplayerSession() {
  window.localStorage.removeItem(MULTIPLAYER_SESSION_KEY);
}
