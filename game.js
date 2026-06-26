(() => {
const { createCards } = window.WinnerCards;
const { cloneValue } = window.WinnerSettings;

function createGameState(settings) {
  return {
    cards: createCards(settings),
    flippedCards: [],
    matchedCards: [],
    players: settings.players.map((name) => ({ name })),
    currentPlayerIndex: 0,
    scores: settings.players.map(() => 0),
    timeLeft: settings.timerEnabled ? settings.timeLimitMinutes * 60 : null,
    settings: cloneValue(settings),
    isLocked: false,
    isFinished: false
  };
}

function hydrateGameState(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.cards) || !Array.isArray(snapshot.players)) {
    return null;
  }

  const flippedIds = Array.isArray(snapshot.flippedCards) ? snapshot.flippedCards : [];

  return {
    cards: snapshot.cards,
    flippedCards: snapshot.cards.filter((card) => flippedIds.includes(card.id)),
    matchedCards: Array.isArray(snapshot.matchedCards) ? snapshot.matchedCards : [],
    players: snapshot.players,
    currentPlayerIndex: Number(snapshot.currentPlayerIndex) || 0,
    scores: Array.isArray(snapshot.scores) ? snapshot.scores : snapshot.players.map(() => 0),
    timeLeft: typeof snapshot.timeLeft === 'number' ? snapshot.timeLeft : null,
    settings: snapshot.settings,
    isLocked: Boolean(snapshot.isLocked),
    isFinished: Boolean(snapshot.isFinished)
  };
}

function flipCard(gameState, cardId) {
  if (gameState.isLocked || gameState.isFinished || gameState.flippedCards.length >= 2) {
    return { status: 'ignored' };
  }

  const card = gameState.cards.find((item) => item.id === cardId);

  if (!card || card.isFlipped || card.isMatched) {
    return { status: 'ignored' };
  }

  card.isFlipped = true;
  gameState.flippedCards.push(card);

  if (gameState.flippedCards.length < 2) {
    return { status: 'flipped' };
  }

  gameState.isLocked = true;
  const [first, second] = gameState.flippedCards;

  if (first.icon === second.icon) {
    first.isMatched = true;
    second.isMatched = true;
    gameState.matchedCards.push(first.id, second.id);
    gameState.scores[gameState.currentPlayerIndex] += 1;
    gameState.flippedCards = [];
    gameState.isLocked = false;

    if (gameState.matchedCards.length === gameState.cards.length) {
      gameState.isFinished = true;
      return { status: 'finished' };
    }

    return { status: 'matched' };
  }

  return { status: 'mismatch' };
}

function closeMismatchedCards(gameState) {
  gameState.flippedCards.forEach((card) => {
    card.isFlipped = false;
  });
  gameState.flippedCards = [];
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  gameState.isLocked = false;
}

function tick(gameState) {
  if (!gameState.settings.timerEnabled || gameState.isFinished || gameState.timeLeft === null) {
    return false;
  }

  gameState.timeLeft = Math.max(0, gameState.timeLeft - 1);

  if (gameState.timeLeft === 0) {
    gameState.isFinished = true;
    return true;
  }

  return false;
}

function getWinners(gameState) {
  const maxScore = Math.max(...gameState.scores);

  return gameState.players
    .map((player, index) => ({ name: player.name, score: gameState.scores[index] }))
    .filter((player) => player.score === maxScore);
}

window.WinnerGame = {
  createGameState,
  hydrateGameState,
  flipCard,
  closeMismatchedCards,
  tick,
  getWinners
};
})();
