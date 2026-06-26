(() => {
if (window.WinnerAppStarted) {
  return;
}

window.WinnerAppStarted = true;

const { CARD_SETS } = window.WinnerCards;
const { closeMismatchedCards, createGameState, flipCard, getWinners, hydrateGameState, tick } = window.WinnerGame;
const {
  FIELD_SIZES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  TIME_OPTIONS,
  clearSavedGame,
  defaultSettings,
  loadSavedGame,
  loadSettings,
  saveGameState,
  saveSettings,
  cloneValue
} = window.WinnerSettings;

let settings = cloneValue(defaultSettings);
let gameState = null;
let timerId = null;
let mismatchTimeout = null;
let savedGameSnapshot = null;

const screens = {
  mainMenu: document.querySelector('#mainMenu'),
  settingsScreen: document.querySelector('#settingsScreen'),
  playersScreen: document.querySelector('#playersScreen'),
  gameScreen: document.querySelector('#gameScreen')
};

const elements = {
  sizeChoices: document.querySelector('#sizeChoices'),
  typeChoices: document.querySelector('#typeChoices'),
  timerEnabled: document.querySelector('#timerEnabled'),
  timeLimit: document.querySelector('#timeLimit'),
  playersList: document.querySelector('#playersList'),
  playerCount: document.querySelector('#playerCount'),
  board: document.querySelector('#board'),
  currentPlayerLabel: document.querySelector('#currentPlayerLabel'),
  currentScoreLabel: document.querySelector('#currentScoreLabel'),
  scoresBoard: document.querySelector('#scoresBoard'),
  timerPill: document.querySelector('#timerPill'),
  pauseOverlay: document.querySelector('#pauseOverlay'),
  resultOverlay: document.querySelector('#resultOverlay'),
  resultTitle: document.querySelector('#resultTitle'),
  resultScores: document.querySelector('#resultScores')
};

init();

async function init() {
  renderSettings();
  bindNavigation();
  bindSettings();
  bindPlayers();
  bindGameControls();
  bindPageLifecycle();
  updateContinueButton();
  registerServiceWorker();
  showScreen('mainMenu');

  try {
    settings = await loadSettings();
    savedGameSnapshot = await loadSavedGame();
    renderSettings();
    updateContinueButton();
  } catch (error) {
    renderSettings();
    updateContinueButton();
  }
}

function bindNavigation() {
  document.querySelector('#startButton').addEventListener('click', startGame);
  document.querySelector('#continueButton').addEventListener('click', continueSavedGame);
  document.querySelector('#settingsButton').addEventListener('click', () => showScreen('settingsScreen'));
  document.querySelector('#quickSettingsButton').addEventListener('click', () => showScreen('settingsScreen'));
  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.go));
  });
}

function bindSettings() {
  elements.timerEnabled.addEventListener('change', () => {
    settings.timerEnabled = elements.timerEnabled.checked;
    settings = saveSettings(settings);
    renderSettings();
  });

  elements.timeLimit.addEventListener('change', () => {
    settings.timeLimitMinutes = Number(elements.timeLimit.value);
    settings = saveSettings(settings);
  });

  document.querySelector('#openPlayersButton').addEventListener('click', () => {
    renderPlayers();
    showScreen('playersScreen');
  });
}

function bindPlayers() {
  document.querySelector('#addPlayerButton').addEventListener('click', () => {
    if (settings.players.length >= MAX_PLAYERS) return;
    settings.players.push(`Игрок ${settings.players.length + 1}`);
    renderPlayers();
  });

  document.querySelector('#removePlayerButton').addEventListener('click', () => {
    if (settings.players.length <= MIN_PLAYERS) return;
    settings.players.pop();
    renderPlayers();
  });

  document.querySelector('#savePlayersButton').addEventListener('click', () => {
    const names = [...elements.playersList.querySelectorAll('input')]
      .map((input, index) => input.value.trim() || `Игрок ${index + 1}`);

    settings.players = names;
    settings = saveSettings(settings);
    showScreen('settingsScreen');
  });
}

function bindGameControls() {
  elements.board.addEventListener('click', (event) => {
    const button = event.target.closest('.card');
    if (!button || !gameState) return;

    const result = flipCard(gameState, button.dataset.cardId);
    renderGame();

    if (result.status === 'mismatch') {
      clearTimeout(mismatchTimeout);
      mismatchTimeout = setTimeout(() => {
        closeMismatchedCards(gameState);
        renderGame();
        persistGame();
      }, 850);
    }

    if (result.status === 'finished') {
      finishGame('Все пары найдены!');
    } else if (result.status !== 'ignored' && result.status !== 'mismatch') {
      persistGame();
    }
  });

  document.querySelector('#pauseButton').addEventListener('click', pauseGame);
  document.querySelector('#closePauseButton').addEventListener('click', resumeGame);
  document.querySelector('#resumeButton').addEventListener('click', resumeGame);
  document.querySelector('#restartButton').addEventListener('click', () => {
    hideOverlay(elements.pauseOverlay);
    startGame();
  });
  document.querySelector('#exitButton').addEventListener('click', exitToMenu);
  document.querySelector('#backToMenuButton').addEventListener('click', exitToMenu);
  document.querySelector('#playAgainButton').addEventListener('click', () => {
    hideOverlay(elements.resultOverlay);
    startGame();
  });
  document.querySelector('#resultExitButton').addEventListener('click', () => {
    hideOverlay(elements.resultOverlay);
    exitToMenu();
  });
}

function bindPageLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      persistGame();
    }
  });

  window.addEventListener('pagehide', persistGame);
}

function renderSettings() {
  elements.sizeChoices.innerHTML = '';
  FIELD_SIZES.forEach((size) => {
    const button = document.createElement('button');
    button.className = `choice-button ${settings.size === size ? 'is-selected' : ''}`;
    button.textContent = `${size}x${size}`;
    button.addEventListener('click', () => {
      settings.size = size;
      settings = saveSettings(settings);
      renderSettings();
    });
    elements.sizeChoices.append(button);
  });

  elements.typeChoices.innerHTML = '';
  Object.entries(CARD_SETS).forEach(([key, set]) => {
    const button = document.createElement('button');
    button.className = `type-button ${settings.cardType === key ? 'is-selected' : ''}`;
    button.innerHTML = `<span>${set.preview}</span><strong>${set.title}</strong>`;
    button.addEventListener('click', () => {
      settings.cardType = key;
      settings = saveSettings(settings);
      renderSettings();
    });
    elements.typeChoices.append(button);
  });

  elements.timerEnabled.checked = settings.timerEnabled;
  elements.timeLimit.disabled = !settings.timerEnabled;
  elements.timeLimit.innerHTML = TIME_OPTIONS
    .map((minutes) => `<option value="${minutes}" ${settings.timeLimitMinutes === minutes ? 'selected' : ''}>${minutes} ${getMinuteWord(minutes)}</option>`)
    .join('');
}

function renderPlayers() {
  elements.playerCount.textContent = settings.players.length;
  elements.playersList.innerHTML = '';

  settings.players.forEach((name, index) => {
    const row = document.createElement('label');
    row.className = 'player-row';
    row.innerHTML = `
      <span>${index + 1}</span>
      <input value="${escapeHtml(name)}" maxlength="16" aria-label="Имя игрока ${index + 1}">
      <button type="button" aria-label="Удалить игрока">🗑</button>
    `;

    row.querySelector('input').addEventListener('input', (event) => {
      settings.players[index] = event.target.value;
    });

    row.querySelector('button').addEventListener('click', () => {
      if (settings.players.length <= MIN_PLAYERS) return;
      settings.players.splice(index, 1);
      renderPlayers();
    });

    elements.playersList.append(row);
  });
}

function startGame() {
  clearTimers();
  clearSavedGame();
  savedGameSnapshot = null;
  updateContinueButton();
  settings = saveSettings(settings);
  gameState = createGameState(settings);
  showScreen('gameScreen');
  renderGame();
  persistGame();
  startTimer();
}

function continueSavedGame() {
  const restoredGame = hydrateGameState(savedGameSnapshot);

  if (!restoredGame) {
    clearSavedGame();
    savedGameSnapshot = null;
    updateContinueButton();
    return;
  }

  clearTimers();
  gameState = restoredGame;
  settings = saveSettings(gameState.settings);
  showScreen('gameScreen');
  renderGame();
  startTimer();
}

function renderGame() {
  if (!gameState) return;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  elements.currentPlayerLabel.textContent = `${gameState.currentPlayerIndex + 1}. ${currentPlayer.name}`;
  elements.currentScoreLabel.textContent = gameState.scores[gameState.currentPlayerIndex];
  elements.timerPill.textContent = gameState.settings.timerEnabled ? formatTime(gameState.timeLeft) : '∞';

  elements.scoresBoard.innerHTML = gameState.players
    .map((player, index) => `
      <div class="score-chip ${index === gameState.currentPlayerIndex ? 'is-current' : ''}">
        <span>${index + 1}</span>
        <strong>${escapeHtml(player.name)}</strong>
        <b>${gameState.scores[index]}</b>
      </div>
    `)
    .join('');

  elements.board.style.setProperty('--columns', gameState.settings.size);
  elements.board.innerHTML = gameState.cards
    .map((card) => `
      <button class="card ${card.isFlipped || card.isMatched ? 'is-open' : ''} ${card.isMatched ? 'is-matched' : ''}" data-card-id="${card.id}" aria-label="Карточка">
        <span class="card-face card-back">★</span>
        <span class="card-face card-front">${card.icon}</span>
      </button>
    `)
    .join('');
}

function startTimer() {
  if (!gameState.settings.timerEnabled) return;

  timerId = setInterval(() => {
    const isFinished = tick(gameState);
    renderGame();
    persistGame();

    if (isFinished) {
      finishGame('Время вышло!');
    }
  }, 1000);
}

function pauseGame() {
  if (!gameState || gameState.isFinished) return;
  clearInterval(timerId);
  showOverlay(elements.pauseOverlay);
}

function resumeGame() {
  hideOverlay(elements.pauseOverlay);
  clearInterval(timerId);
  startTimer();
}

function exitToMenu() {
  clearTimers();
  gameState = null;
  clearSavedGame();
  savedGameSnapshot = null;
  updateContinueButton();
  hideOverlay(elements.pauseOverlay);
  hideOverlay(elements.resultOverlay);
  showScreen('mainMenu');
}

function finishGame(title) {
  clearTimers();
  gameState.isFinished = true;
  clearSavedGame();
  savedGameSnapshot = null;
  updateContinueButton();
  elements.resultTitle.textContent = title;

  const winners = getWinners(gameState);
  const winnerText = winners.length === 1
    ? `Победитель: ${winners[0].name}`
    : `Ничья: ${winners.map((winner) => winner.name).join(', ')}`;

  elements.resultScores.innerHTML = `
    <strong>${escapeHtml(winnerText)}</strong>
    ${gameState.players.map((player, index) => `<p>${escapeHtml(player.name)}: ${gameState.scores[index]}</p>`).join('')}
  `;
  showOverlay(elements.resultOverlay);
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove('is-active'));
  screens[screenName].classList.add('is-active');
}

function showOverlay(overlay) {
  overlay.hidden = false;
}

function hideOverlay(overlay) {
  overlay.hidden = true;
}

function clearTimers() {
  clearInterval(timerId);
  clearTimeout(mismatchTimeout);
}

function persistGame() {
  if (!gameState || gameState.isFinished) return;
  savedGameSnapshot = saveGameState(gameState);
  updateContinueButton();
}

function updateContinueButton() {
  const button = document.querySelector('#continueButton');
  button.hidden = !savedGameSnapshot || savedGameSnapshot.isFinished;
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (isLocalDevelopment()) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      })
      .catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // PWA mode is optional; the game still works without a service worker.
    });
  });
}

function isLocalDevelopment() {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
}
})();

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function getMinuteWord(minutes) {
  return minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
