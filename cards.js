(() => {
const CARD_SETS = {
  animals: {
    title: 'Животные',
    preview: '🐶',
    icons: ['🐶', '🐱', '🦊', '🐼', '🐸', '🐵', '🦁', '🐯', '🐰', '🐨', '🐮', '🐷', '🐙', '🦄', '🐧', '🦉', '🐢', '🦋', '🐝', '🦀', '🐳', '🦕', '🦒', '🦓', '🦔', '🦜', '🦩', '🐺', '🐴', '🐞', '🦥', '🦦', '🦇', '🦘', '🐊', '🦌', '🐿️', '🦡', '🦎', '🦭', '🦢', '🦚', '🦆', '🐗', '🦬', '🐐', '🐑', '🐓', '🦃', '🦍']
  },
  cars: {
    title: 'Машины',
    preview: '🚗',
    icons: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🚂', '🚆', '🚇', '🚝', '🚅', '✈️', '🚁', '🚀', '🛸', '⛵', '🚤', '🛳️', '🚢', '🛶', '🚟', '🚠', '🚡', '🛴', '🛹', '🛼', '🛩️', '🚞', '🚋', '🚉', '🛫', '🛬', '🛰️', '🚊', '🚈', '🚖', '🚘', '🚍']
  },
  smiles: {
    title: 'Смайлики',
    preview: '🙂',
    icons: ['😀', '😄', '😁', '😆', '🙂', '😉', '😍', '😘', '😎', '🤩', '🥳', '😇', '😂', '🤣', '😋', '😜', '🤪', '😌', '😴', '🤠', '😺', '😻', '🙃', '🥰', '😛', '🤓', '🧐', '😮', '😲', '🥹', '😭', '😤', '😡', '🥶', '🥵', '🤯', '😱', '🤗', '🤭', '🫣', '🤫', '😬', '🙄', '😏', '😵', '🥴', '😈', '👻', '🤖', '🎃']
  },
  plants: {
    title: 'Растения',
    preview: '🌿',
    icons: ['🌵', '🎄', '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🪻', '🪷', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄']
  }
};

function createCards(settings) {
  const totalCards = settings.size * settings.size;

  if (totalCards % 2 !== 0) {
    throw new Error('Количество карточек должно делиться на 2.');
  }

  const set = CARD_SETS[settings.cardType];
  const pairsNeeded = totalCards / 2;

  if (!set || set.icons.length < pairsNeeded) {
    throw new Error('В выбранном наборе недостаточно уникальных карточек.');
  }

  const uniqueIcons = set.icons.slice(0, pairsNeeded);
  const pairedIcons = uniqueIcons.flatMap((icon) => [icon, icon]);

  return shuffle(pairedIcons).map((icon, index) => ({
    id: `${icon}-${index}`,
    icon,
    isFlipped: false,
    isMatched: false
  }));
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

window.WinnerCards = {
  CARD_SETS,
  createCards
};
})();
