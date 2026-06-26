const FIELD_SIZES = [4, 6, 8, 10];
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 1;
const TIME_OPTIONS = [1, 2, 3, 4, 5];

const STORAGE_KEY = 'winner-card-settings';
const GAME_STATE_KEY = 'winner-card-game-state';

const defaultSettings = {
  size: 4,
  cardType: 'animals',
  timerEnabled: true,
  timeLimitMinutes: 3,
  players: ['Игрок 1', 'Игрок 2']
};

async function loadSettings() {
  const saved = await window.WinnerDB.readValue(STORAGE_KEY, null);

  if (!saved) {
    const legacySettings = readLegacySettings();
    return legacySettings ? normalizeSettings(legacySettings) : structuredClone(defaultSettings);
  }

  try {
    return normalizeSettings(saved);
  } catch {
    return structuredClone(defaultSettings);
  }
}

function saveSettings(settings) {
  const normalized = normalizeSettings(settings);
  window.WinnerDB.writeValue(STORAGE_KEY, normalized);
  return normalized;
}

async function loadSavedGame() {
  return window.WinnerDB.readValue(GAME_STATE_KEY, null);
}

function saveGameState(gameState) {
  if (!gameState || gameState.isFinished) {
    return clearSavedGame();
  }

  const snapshot = {
    ...gameState,
    flippedCards: gameState.flippedCards.map((card) => card.id),
    savedAt: Date.now()
  };

  window.WinnerDB.writeValue(GAME_STATE_KEY, snapshot);
  return snapshot;
}

function clearSavedGame() {
  window.WinnerDB.deleteValue(GAME_STATE_KEY);
}

function normalizeSettings(settings) {
  const size = FIELD_SIZES.includes(Number(settings.size)) ? Number(settings.size) : defaultSettings.size;
  const timeLimitMinutes = TIME_OPTIONS.includes(Number(settings.timeLimitMinutes))
    ? Number(settings.timeLimitMinutes)
    : defaultSettings.timeLimitMinutes;

  const players = Array.isArray(settings.players)
    ? settings.players.map((name) => String(name).trim()).filter(Boolean)
    : defaultSettings.players;

  return {
    size,
    cardType: settings.cardType || defaultSettings.cardType,
    timerEnabled: Boolean(settings.timerEnabled),
    timeLimitMinutes,
    players: players.slice(0, MAX_PLAYERS).length ? players.slice(0, MAX_PLAYERS) : ['Игрок 1']
  };
}

function readLegacySettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

window.WinnerSettings = {
  FIELD_SIZES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  TIME_OPTIONS,
  defaultSettings,
  loadSettings,
  saveSettings,
  loadSavedGame,
  saveGameState,
  clearSavedGame,
  normalizeSettings
};
