/**
 * @typedef {Object} Suit
 * @property {string} symbol Symbole de la couleur.
 * @property {string} name Nom français de la couleur.
 * @property {string} colorClass Classe CSS pour la couleur de la carte.
 */

/**
 * @typedef {Object} Figure
 * @property {string} label Valeur affichée sur la carte.
 * @property {number} value Valeur de la figure au Blackjack.
 */

/**
 * @typedef {Object} Card
 * @property {string} label Valeur affichée sur la carte.
 * @property {number} value Valeur de la carte.
 * @property {Suit} suit Couleur de la carte.
 */

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [initialDeal] Indique la distribution initiale.
 * @property {boolean} [playerDeal] Indique le tirage d'une main du joueur.
 * @property {number} [handId] Identifiant de la main concernée par le tirage.
 * @property {boolean} [dealerDeal] Indique le tirage du dealer.
 * @property {boolean} [dealerFlip] Indique le retournement du dealer.
 */

/**
 * @typedef {Object} Hand
 * @property {number} id Identifiant de la main.
 * @property {Card[]} cards Cartes de la main.
 * @property {number} stake Mise courante de la main.
 * @property {"playing"|"stood"|"busted"} status État de la main.
 * @property {HandResult} result Résultat de la main.
 * @property {number} net Bilan de la main.
 * @property {boolean} doubled Indique si la main a été doublée.
 * @property {boolean} fromSplit Indique si la main provient d'un split.
 */

/** @typedef {"idle"|"insurance"|"even-money"|"player"|"dealer"|"over"} GameState */

/** @typedef {"unavailable"|"offered"|"taken"|"declined"} InsuranceState */

/** @typedef {"" | "win" | "loss" | "push" | "blackjack" | "evenMoney"} HandResult */

/** @type {HTMLElement|null} */
const warning = document.getElementById("js-warning");

if (warning) {
  warning.style.display = "none";
}

/** @type {HTMLElement} */
const playerHandElement = document.getElementById("player-hand");
/** @type {HTMLElement} */
const dealerHandElement = document.getElementById("dealer-hand");
/** @type {HTMLElement|null} */
const playerTotalElement = document.getElementById("player-total");
/** @type {HTMLElement} */
const dealerTotalElement = document.getElementById("dealer-total");
/** @type {HTMLElement} */
const statusElement = document.getElementById("game-status");
/** @type {HTMLElement} */
const activeHandLabel = document.getElementById("active-hand-label");
/** @type {HTMLElement|null} */
const playerHeadingElement = document.getElementById("player-heading");
/** @type {HTMLButtonElement} */
const hitButton = document.getElementById("hit-button");
/** @type {HTMLButtonElement} */
const standButton = document.getElementById("stand-button");
/** @type {HTMLButtonElement} */
const doubleButton = document.getElementById("double-button");
/** @type {HTMLButtonElement} */
const splitButton = document.getElementById("split-button");
/** @type {HTMLButtonElement} */
const insuranceButton = document.getElementById("insurance-button");
/** @type {HTMLButtonElement} */
const declineInsuranceButton = document.getElementById("decline-insurance-button");
/** @type {HTMLButtonElement} */
const evenMoneyButton = document.getElementById("even-money-button");
/** @type {HTMLButtonElement} */
const declineEvenMoneyButton = document.getElementById("decline-even-money-button");
/** @type {HTMLElement} */
const insuranceActions = document.getElementById("insurance-actions");
/** @type {HTMLElement} */
const evenMoneyActions = document.getElementById("even-money-actions");
/** @type {HTMLButtonElement} */
const startButton = document.getElementById("start-button");
/** @type {HTMLButtonElement} */
const restartButton = document.getElementById("restart-button");
/** @type {HTMLElement} */
const overlay = document.getElementById("game-overlay");
/** @type {HTMLElement} */
const overlayTitle = document.getElementById("overlay-title");
/** @type {HTMLElement} */
const overlayMessage = document.getElementById("overlay-message");
/** @type {HTMLElement} */
const overlayKicker = document.getElementById("overlay-kicker");
/** @type {HTMLElement} */
const finalScoresElement = document.getElementById("final-scores");
/** @type {HTMLElement} */
const bankrollElement = document.getElementById("bankroll");
/** @type {HTMLInputElement} */
const stakeInput = document.getElementById("stake-input");
/** @type {HTMLElement} */
const stakeHintElement = document.getElementById("stake-hint");
/** @type {HTMLButtonElement} */
const themeToggle = document.getElementById("theme-toggle");
/** @type {HTMLElement} */
const themeIcon = document.querySelector(".theme-icon");

/** @type {string} */
let currentTheme = document.documentElement.getAttribute("data-theme") || "light";

/**
 * États possibles de la partie.
 * @type {Readonly<Object>}
 */
const GAME_STATES = Object.freeze({
  IDLE: "idle",
  INSURANCE: "insurance",
  EVEN_MONEY: "even-money",
  PLAYER: "player",
  DEALER: "dealer",
  OVER: "over",
});

/** @type {Readonly<Object>} */
const HAND_STATUSES = Object.freeze({
  PLAYING: "playing",
  STOOD: "stood",
  BUSTED: "busted",
});

/** @type {Readonly<Object>} */
const RESULT_LABELS = Object.freeze({
  win: "Gagnée",
  loss: "Perdue",
  push: "Égalité",
  blackjack: "Blackjack",
  evenMoney: "Blackjack 1:1",
});

/** @type {number} */
const INITIAL_CARD_DELAY = 70;
/** @type {number} */
const DEALER_FLIP_DELAY = 520;
/** @type {number} */
const DEALER_DRAW_DELAY = 450;
/**
 * Délai avant l'overlay de fin pour laisser le résultat de la manche visible.
 * @type {number}
 */
const ROUND_END_OVERLAY_DELAY = 900;
/** @type {number} */
const DEALER_STAND_TOTAL = 17;
/**
 * Mise proposée au démarrage lorsque le solde le permet.
 * @type {number}
 */
const DEFAULT_STAKE = 10;
/**
 * Mise minimale, expressed en jetons entières.
 * @type {number}
 */
const MIN_STAKE = 1;
/**
 * Solde initial fictif avant le choix de la première mise.
 * @type {number}
 */
const STARTING_BANKROLL = 1000;
/**
 * Bénéfice net d'un blackjack naturel, soit un paiement de 3:2.
 * @type {number}
 */
const NATURAL_PAYOUT = 1.5;
/**
 * Bénéfice net de l'assurance, soit un paiement de 2:1.
 * @type {number}
 */
const INSURANCE_PAYOUT = 2;
/**
 * Remboursement total d'une victoire ordinaire, mise comprise.
 * @type {number}
 */
const WIN_PAYOUT_MULTIPLIER = 2;

/** @type {Figure[]} */
const FIGURES = [
  { label: "A", value: 11 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 10 },
  { label: "Q", value: 10 },
  { label: "K", value: 10 },
];

/** @type {Suit[]} */
const SUITS = [
  { symbol: "♠", name: "pique", colorClass: "card--black" },
  { symbol: "♥", name: "cœur", colorClass: "card--red" },
  { symbol: "♦", name: "carreau", colorClass: "card--red" },
  { symbol: "♣", name: "trèfle", colorClass: "card--black" },
];

/** @type {Card[]} */
let deck = [];
/** @type {Hand[]} */
let playerHands = [];
/** @type {Card[]} */
let dealerCards = [];
/** @type {GameState} */
let gameState = GAME_STATES.IDLE;
/** @type {number} */
let activeHandIndex = 0;
/** @type {boolean} */
let splitUsed = false;
/** @type {boolean} */
let dealerRevealed = false;
/** @type {boolean} */
let evenMoneyAccepted = false;
/** @type {number} */
let bankroll = STARTING_BANKROLL;
/** @type {number} */
let selectedStake = DEFAULT_STAKE;
/** @type {number} */
let roundStake = DEFAULT_STAKE;
/** @type {number} */
let roundStartBankroll = STARTING_BANKROLL;
/** @type {number} */
let roundId = 0;
/** @type {number} */
let scheduledDealerRoundId = 0;
/** @type {number} */
let scheduledOverlayRoundId = 0;
/** @type {string} */
let scheduledOverlayMessage = "";
/** @type {InsuranceState} */
let insuranceStatus = "unavailable";
/** @type {number} */
let insuranceNet = 0;

/**
 * Mélange les cartes en place.
 * @param {Card[]} cards Cartes à mélanger.
 * @returns {Card[]} Les mêmes cartes, dans un ordre aléatoire.
 */
function shuffle(cards) {
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryCard = cards[index];
    cards[index] = cards[randomIndex];
    cards[randomIndex] = temporaryCard;
  }

  return cards;
}

/**
 * Crée un deck de 52 cartes uniques, puis le mélange.
 * @returns {Card[]} Le deck complet et mélangé.
 */
function createDeck() {
  const newDeck = [];

  for (const figure of FIGURES) {
    for (const suit of SUITS) {
      newDeck.push({
        label: figure.label,
        value: figure.value,
        suit,
      });
    }
  }

  return shuffle(newDeck);
}

/**
 * Retire une carte du dessus du deck.
 * @param {Card[]} cards Deck source.
 * @returns {Card|null} La carte retirée ou null si le deck est vide.
 */
function drawCard(cards) {
  return cards.length > 0 ? cards.pop() : null;
}

/**
 * Calcule le total d'une main : chaque as vaut 11 puis 1 lorsque nécessaire pour ne pas dépasser 21.
 * @param {Card[]} cards Cartes de la main.
 * @returns {number} Total de la main, sans dépasser 21 si possible.
 */
function calculateTotal(cards) {
  let total = 0;
  let acesToDowngrade = 0;

  for (const card of cards) {
    total += card.value;

    if (card.label === "A") {
      acesToDowngrade += 1;
    }
  }

  while (total > 21 && acesToDowngrade > 0) {
    total -= 10;
    acesToDowngrade -= 1;
  }

  return total;
}

/**
 * Indique si une carte vaut 10.
 * @param {Card} card Carte à vérifier.
 * @returns {boolean} true si la carte vaut 10.
 */
function isTenCard(card) {
  return card.value === 10;
}

/**
 * Indique si une main est un blackjack naturel.
 * @param {Card[]} cards Cartes de la main.
 * @returns {boolean} true pour un As et une carte de valeur 10 en deux cartes.
 */
function isNatural(cards) {
  let hasAce = false;
  let hasTen = false;

  for (const card of cards) {
    if (card.label === "A") {
      hasAce = true;
    }

    if (isTenCard(card)) {
      hasTen = true;
    }
  }

  return cards.length === 2 && hasAce && hasTen;
}

/**
 * Crée une main de jeu.
 * @param {Card[]} cards Cartes initiales.
 * @param {number} id Identifiant de la main.
 * @param {boolean} fromSplit Indique si la main vient d'un split.
 * @returns {Hand} Nouvelle main.
 */
function createHand(cards, id, fromSplit) {
  return {
    id,
    cards,
    stake: roundStake,
    status: HAND_STATUSES.PLAYING,
    result: "",
    net: 0,
    doubled: false,
    fromSplit,
  };
}

/**
 * Retourne la main active du joueur.
 * @returns {Hand|null} Main active ou null.
 */
function getActiveHand() {
  return playerHands[activeHandIndex] || null;
}

/**
 * Retourne le libellé visible d'une main.
 * @param {Hand} hand Main à étiqueter.
 * @returns {string} Libellé adapté au nombre de mains.
 */
function getHandLabel(hand) {
  return playerHands.length > 1 ? "Main " + hand.id : "Votre main";
}

/**
 * Indique si une main est un blackjack naturel non issu d'un split.
 * @param {Hand} hand Main à vérifier.
 * @returns {boolean} true si la main est un blackjack naturel.
 */
function isNaturalHand(hand) {
  return !hand.fromSplit && isNatural(hand.cards);
}

/**
 * Indique si le double est disponible.
 * @param {Hand|null} hand Main à vérifier.
 * @returns {boolean} true si le double peut être utilisé.
 */
function canDouble(hand) {
  return Boolean(
    gameState === GAME_STATES.PLAYER &&
      hand &&
      hand.status === HAND_STATUSES.PLAYING &&
      !hand.doubled &&
      !hand.fromSplit &&
      !isNatural(hand.cards) &&
      bankroll >= hand.stake,
  );
}

/**
 * Indique si le split est disponible.
 * @param {Hand|null} hand Main à vérifier.
 * @returns {boolean} true si le split peut être utilisé.
 */
function canSplit(hand) {
  return Boolean(
    gameState === GAME_STATES.PLAYER &&
      hand &&
      hand.status === HAND_STATUSES.PLAYING &&
      !splitUsed &&
      hand.cards.length === 2 &&
      hand.cards[0].label === hand.cards[1].label &&
      !isNatural(hand.cards) &&
      bankroll >= hand.stake,
  );
}

/**
 * Indique si la carte visible du dealer vaut 10.
 * @returns {boolean} true si la carte visible vaut 10.
 */
function isDealerUpcardTen() {
  return dealerCards.length > 0 && isTenCard(dealerCards[0]);
}

/**
 * Indique si la carte visible du dealer est un As.
 * @returns {boolean} true si la carte visible est un As.
 */
function isDealerUpcardAce() {
  return dealerCards.length > 0 && dealerCards[0].label === "A";
}

/**
 * Crée l'élément DOM d'une carte.
 * @param {Card} card Carte à afficher.
 * @param {boolean} faceDown Indique si la carte doit rester cachée.
 * @returns {HTMLElement} Élément DOM de la carte.
 */
function createCardElement(card, faceDown) {
  const cardElement = document.createElement("article");
  const cardClass = faceDown ? "card back" : "card " + card.suit.colorClass;

  cardElement.className = cardClass;
  cardElement.setAttribute(
    "aria-label",
    faceDown ? "Carte cachée" : card.label + " de " + card.suit.name,
  );

  if (!faceDown) {
    const cornerClasses = ["color-tl corner", "color-br corner"];

    for (const cornerClass of cornerClasses) {
      const cornerElement = document.createElement("div");
      cornerElement.className = cornerClass;
      cornerElement.innerHTML = card.label + "<br>" + card.suit.symbol;
      cardElement.appendChild(cornerElement);
    }

    const valueElement = document.createElement("div");
    valueElement.className = "value";
    valueElement.textContent = card.label + card.suit.symbol;
    cardElement.appendChild(valueElement);
  }

  return cardElement;
}

/**
 * Ajoute l'animation de distribution à une carte si nécessaire.
 * @param {HTMLElement} cardElement Carte à animer.
 * @param {boolean} shouldAnimate Indique si l'animation doit être ajoutée.
 * @param {number} delay Délai de l'animation en millisecondes.
 * @returns {void}
 */
function addDealAnimation(cardElement, shouldAnimate, delay) {
  if (!shouldAnimate) {
    return;
  }

  cardElement.classList.add("card--dealing");
  cardElement.style.animationDelay = delay + "ms";
}

/**
 * Affiche les mains du joueur et leurs informations de mise.
 * @param {RenderOptions} [options] Options de rendu et d'animation.
 * @returns {void}
 */
function renderPlayerHands(options = {}) {
  playerHandElement.innerHTML = "";
  playerHandElement.setAttribute("data-hands", String(playerHands.length));
  if (playerHeadingElement) {
    playerHeadingElement.textContent = playerHands.length > 1 ? "Vos mains" : "Votre main";
  }
  const showHandTitles = playerHands.length > 1;

  for (const hand of playerHands) {
    const handElement = document.createElement("article");
    const cardsElement = document.createElement("div");
    const titleElement = showHandTitles ? document.createElement("h3") : null;
    const totalElement = document.createElement("p");
    const stakeElement = document.createElement("p");
    const resultElement = document.createElement("p");
    const isActive =
      gameState === GAME_STATES.PLAYER && playerHands[activeHandIndex] === hand;

    handElement.className = "player-hand-panel";
    handElement.setAttribute("data-hand-id", String(hand.id));
    handElement.setAttribute("data-active", String(isActive));
    handElement.setAttribute(
      "aria-label",
      getHandLabel(hand) + (isActive && playerHands.length > 1 ? ", active" : ""),
    );

    if (titleElement) {
      titleElement.textContent = getHandLabel(hand);
    }
    cardsElement.className = "player-hand-cards";

    for (let index = 0; index < hand.cards.length; index += 1) {
      const cardElement = createCardElement(hand.cards[index], false);
      const isNewCard =
        options.initialDeal ||
        (options.playerDeal &&
          options.handId === hand.id &&
          index === hand.cards.length - 1);

      addDealAnimation(
        cardElement,
        isNewCard,
        options.initialDeal ? index * INITIAL_CARD_DELAY : 0,
      );
      cardsElement.appendChild(cardElement);
    }

    totalElement.textContent = "Total : " + calculateTotal(hand.cards);
    stakeElement.className = "hand-stake";
    stakeElement.textContent = "Mise : " + hand.stake + " jetons";
    resultElement.className = "hand-result";
    resultElement.textContent = getHandStatusLabel(hand, isActive);

    if (titleElement) {
      handElement.appendChild(titleElement);
    }
    handElement.appendChild(cardsElement);
    handElement.appendChild(totalElement);
    handElement.appendChild(stakeElement);
    handElement.appendChild(resultElement);
    playerHandElement.appendChild(handElement);
  }
}

/**
 * Affiche la main du dealer et gère sa carte cachée.
 * @param {RenderOptions} [options] Options de rendu et d'animation.
 * @returns {void}
 */
function renderDealerHand(options = {}) {
  dealerHandElement.innerHTML = "";

  for (let index = 0; index < dealerCards.length; index += 1) {
    const faceDown = index === 1 && !dealerRevealed;
    const cardElement = createCardElement(dealerCards[index], faceDown);
    const isNewCard =
      !faceDown &&
      (options.initialDeal ||
        (options.dealerDeal && index === dealerCards.length - 1));

    addDealAnimation(
      cardElement,
      isNewCard,
      options.initialDeal ? index * INITIAL_CARD_DELAY : 0,
    );

    if (!faceDown && options.dealerFlip && index === 1) {
      cardElement.classList.add("card--flip-in");
    }

    dealerHandElement.appendChild(cardElement);
  }
}

/**
 * Affiche les mains du joueur et du dealer.
 * @param {RenderOptions} [options] Options de rendu et d'animation.
 * @returns {void}
 */
function renderHands(options = {}) {
  renderPlayerHands(options);
  renderDealerHand(options);
}

/**
 * Met à jour les totaux affichés.
 * @returns {void}
 */
function updateTotals() {
  const activeHand = getActiveHand();
  const dealerTotal = calculateTotal(dealerCards);

  if (playerTotalElement) {
    playerTotalElement.textContent = activeHand ? calculateTotal(activeHand.cards) : 0;
  }

  dealerTotalElement.textContent =
    dealerCards.length === 0 ? "0" : dealerRevealed ? dealerTotal : "?";
  const showActiveHand = playerHands.length > 1 && gameState === GAME_STATES.PLAYER;
  activeHandLabel.hidden = !showActiveHand;
  if (showActiveHand) {
    activeHandLabel.textContent = "Active : Main " + (activeHandIndex + 1);
  }
}

/**
 * Retourne la valeur actuellement saisie pour la mise.
 * @returns {number} Valeur saisie, ou NaN si elle est invalide.
 */
function getStakeValue() {
  if (stakeInput.value.trim() === "") {
    return NaN;
  }

  const value = Number(stakeInput.value);
  return Number.isInteger(value) ? value : NaN;
}

/**
 * Vérifie qu'une mise peut être utilisée avec le solde actuel.
 * @param {number} value Mise à vérifier.
 * @returns {boolean} true si la mise est valide.
 */
function isValidStake(value) {
  return Number.isInteger(value) && value >= MIN_STAKE && value <= bankroll;
}

/**
 * Met à jour le champ de mise et le solde disponible.
 * @returns {void}
 */
function updateStakeControl() {
  const hasBankroll = bankroll >= MIN_STAKE;
  stakeInput.max = String(bankroll);
  stakeInput.disabled = !hasBankroll;

  if (!hasBankroll) {
    selectedStake = 0;
    stakeInput.value = "0";
  } else if (!isValidStake(getStakeValue())) {
    selectedStake = Math.max(
      MIN_STAKE,
      Math.min(selectedStake || DEFAULT_STAKE, bankroll),
    );
    stakeInput.value = String(selectedStake);
  }

  stakeHintElement.textContent = hasBankroll
    ? "Solde disponible : " + bankroll + " jetons."
    : "Solde épuisé : vous ne pouvez plus miser.";
}

/**
 * Met à jour le solde et les informations de mise.
 * @returns {void}
 */
function updateBankroll() {
  bankrollElement.textContent = bankroll;
  updateStakeControl();
}

/**
 * Enregistre la mise saisie par le joueur.
 * @returns {void}
 */
function handleStakeInput() {
  const value = getStakeValue();

  if (Number.isInteger(value) && value >= MIN_STAKE) {
    selectedStake = value;
  }

  updateStakeControl();
}

/**
 * Active ou désactive les actions du joueur selon l'état du jeu.
 * @returns {void}
 */
function updateControls() {
  const activeHand = getActiveHand();
  const playerTurn =
    gameState === GAME_STATES.PLAYER &&
    activeHand !== null &&
    activeHand.status === HAND_STATUSES.PLAYING;
  const activeTotal = activeHand ? calculateTotal(activeHand.cards) : 0;

  hitButton.disabled = !playerTurn || activeTotal >= 21;
  standButton.disabled = !playerTurn;
  doubleButton.disabled = !playerTurn || !canDouble(activeHand);
  splitButton.disabled = !playerTurn || !canSplit(activeHand);
  insuranceActions.hidden = gameState !== GAME_STATES.INSURANCE;
  if (gameState === GAME_STATES.INSURANCE) {
    insuranceButton.textContent =
      "Assurance (" + roundStake + " jetons, 2:1)";
    insuranceButton.setAttribute(
      "aria-label",
      "Prendre une assurance de " + roundStake + " jetons, payée 2 contre 1",
    );
  }
  evenMoneyActions.hidden = gameState !== GAME_STATES.EVEN_MONEY;
}

/**
 * Affiche un message de statut.
 * @param {string} message Message à afficher.
 * @returns {void}
 */
function setStatus(message) {
  statusElement.textContent = message;
}

/**
 * Formate un bilan en jetons.
 * @param {number} value Bilan à formater.
 * @returns {string} Bilan formaté.
 */
function formatJetons(value) {
  return value > 0 ? "+" + value + " jetons" : value + " jetons";
}

/**
 * Retourne le libellé d'un résultat de main.
 * @param {HandResult} result Résultat de la main.
 * @returns {string} Libellé français.
 */
function getResultLabel(result) {
  return RESULT_LABELS[result] || result;
}

/**
 * Retourne le libellé d'état d'une main pour le panneau de jeu.
 * @param {Hand} hand Main à décrire.
 * @param {boolean} isActive Indique si la main est active pendant le tour du joueur.
 * @returns {string} Libellé français.
 */
function getHandStatusLabel(hand, isActive) {
  if (hand.result) {
    return getResultLabel(hand.result);
  }

  if (hand.status === HAND_STATUSES.BUSTED) {
    return "Dépassée";
  }

  return isActive ? "En jeu" : "En attente";
}

/**
 * Affiche l'overlay de début ou de fin.
 * @param {string} kicker Petit titre de l'overlay.
 * @param {string} title Titre principal de l'overlay.
 * @param {string} message Message de l'overlay.
 * @param {boolean} gameIsOver Indique si la partie est terminée.
 * @returns {void}
 */
function showOverlay(kicker, title, message, gameIsOver) {
  const canContinue = bankroll >= MIN_STAKE;

  overlay.hidden = false;
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  finalScoresElement.hidden = !gameIsOver;
  startButton.hidden = gameIsOver && !canContinue;
  restartButton.hidden = !gameIsOver;
  startButton.textContent = gameIsOver ? "Jouer une main" : "Commencer la partie";
  restartButton.textContent = "Nouvelle partie";

  if (gameIsOver) {
    (canContinue ? startButton : restartButton).focus();
  } else {
    startButton.focus();
  }
}

/**
 * Affiche l'overlay de début de partie.
 * @returns {void}
 */
function showStartOverlay() {
  finalScoresElement.textContent = "";
  updateStakeControl();
  showOverlay(
    "La table est prête",
    "Prêt à jouer ?",
    "Choisissez votre mise avant de recevoir vos cartes.",
    false,
  );
}

/**
 * Construit le récapitulatif des résultats de la donne.
 * @returns {string} Résumé des scores.
 */
function getFinalScoreText() {
  const handScores = [];

  for (const hand of playerHands) {
    const total = calculateTotal(hand.cards);
    const result = getHandStatusLabel(hand, false);

    handScores.push(
      getHandLabel(hand) + " : " + total + " (" + result + ", " + formatJetons(hand.net) + ")",
    );
  }

  let insuranceText = "Sans assurance";
  if (insuranceStatus === "taken") {
    insuranceText = "Assurance : " + formatJetons(insuranceNet);
  } else if (insuranceStatus === "declined") {
    insuranceText = "Assurance refusée";
  }

  handScores.push(insuranceText);
  handScores.push("Bilan : " + formatJetons(bankroll - roundStartBankroll));
  return handScores.join(" | ");
}

/**
 * Affiche l'overlay de fin et les résultats des mains.
 * @param {string} message Message indiquant le résultat.
 * @returns {void}
 */
function showGameOverOverlay(message) {
  if (gameState !== GAME_STATES.OVER) {
    return;
  }

  const isBankrupt = bankroll < MIN_STAKE;
  const bankruptcyMessage =
    "Votre solde est de " +
    bankroll +
    " jetons : vous ne pouvez plus miser " +
    MIN_STAKE +
    " jetons.";
  finalScoresElement.textContent = getFinalScoreText();
  showOverlay(
    isBankrupt ? "Solde épuisé" : "Nouvelle donne",
    isBankrupt ? "Partie terminée" : "Donne terminée",
    isBankrupt ? bankruptcyMessage : message,
    true,
  );
}

/**
 * Met à jour l'icône et les attributs accessibles du bouton de thème.
 * @returns {void}
 */
function updateThemeButton() {
  const isDark = currentTheme === "dark";

  themeIcon.className =
    "theme-icon " + (isDark ? "theme-icon--sun" : "theme-icon--moon");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Activer le thème jour" : "Activer le thème nuit",
  );
}

/**
 * Alterne entre le thème jour et le thème nuit.
 * @returns {void}
 */
function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton();
}

/**
 * Change l'état du jeu et actualise les actions disponibles.
 * @param {GameState} nextState Nouvel état de la partie.
 * @returns {void}
 */
function setGameState(nextState) {
  gameState = nextState;
  updateControls();
}

/**
 * Réinitialise les données d'une donne.
 * @returns {void}
 */
function resetRound() {
  roundId += 1;
  deck = [];
  playerHands = [];
  dealerCards = [];
  activeHandIndex = 0;
  splitUsed = false;
  dealerRevealed = false;
  evenMoneyAccepted = false;
  insuranceStatus = "unavailable";
  insuranceNet = 0;
  roundStartBankroll = bankroll;
  scheduledDealerRoundId = 0;
  scheduledOverlayRoundId = 0;
  scheduledOverlayMessage = "";
}

/**
 * Révèle la main du dealer.
 * @returns {void}
 */
function revealDealer() {
  if (dealerRevealed) {
    return;
  }

  dealerRevealed = true;
  renderHands({ dealerFlip: true });
  updateTotals();
}

/**
 * Vérifie immédiatement le blackjack du dealer sans révéler sa carte cachée si le total n'est pas naturel.
 * @returns {boolean} true si le dealer possède un blackjack naturel.
 */
function resolveDealerBlackjack() {
  if (!isNatural(dealerCards)) {
    return false;
  }

  revealDealer();
  settleRound("Le dealer possède un blackjack naturel.");
  return true;
}

/**
 * Gère le blackjack naturel du joueur au début de la donne.
 * @returns {void}
 */
function handleInitialNatural() {
  if (isDealerUpcardAce()) {
    setGameState(GAME_STATES.EVEN_MONEY);
    setStatus("Blackjack naturel ! Choisissez even money ou conservez le paiement 3:2.");
    return;
  }

  if (isDealerUpcardTen() && resolveDealerBlackjack()) {
    return;
  }

  settleRound("Blackjack naturel !");
}

/**
 * Démarre une nouvelle donne.
 * @returns {void}
 */
function startGame() {
  if (gameState !== GAME_STATES.IDLE && gameState !== GAME_STATES.OVER) {
    return;
  }

  const stake = getStakeValue();

  if (bankroll < MIN_STAKE) {
    updateBankroll();
    setGameState(GAME_STATES.OVER);
    showGameOverOverlay("Votre solde est épuisé.");
    return;
  }

  if (!isValidStake(stake)) {
    stakeHintElement.textContent =
      "Choisissez une mise entre " + MIN_STAKE + " et " + bankroll + " jetons.";
    stakeInput.focus();
    return;
  }

  selectedStake = stake;
  roundStake = stake;
  resetRound();
  deck = createDeck();

  const firstPlayerCard = drawCard(deck);
  const secondPlayerCard = drawCard(deck);
  const firstDealerCard = drawCard(deck);
  const secondDealerCard = drawCard(deck);

  if (!firstPlayerCard || !secondPlayerCard || !firstDealerCard || !secondDealerCard) {
    setGameState(GAME_STATES.IDLE);
    showStartOverlay();
    return;
  }

  bankroll -= roundStake;
  playerHands = [createHand([firstPlayerCard, secondPlayerCard], 1, false)];
  dealerCards = [firstDealerCard, secondDealerCard];

  setGameState(GAME_STATES.PLAYER);
  renderHands({ initialDeal: true });
  updateTotals();
  updateBankroll();
  overlay.hidden = true;
  finalScoresElement.hidden = true;
  finalScoresElement.textContent = "";

  if (isNaturalHand(getActiveHand())) {
    handleInitialNatural();
    return;
  }

  if (isDealerUpcardAce()) {
    insuranceStatus = "offered";
    setGameState(GAME_STATES.INSURANCE);
    setStatus("");
    return;
  }

  if (isDealerUpcardTen() && resolveDealerBlackjack()) {
    return;
  }

  setStatus("À vous de jouer.");
}

/**
 * Réinitialise le solde et les paramètres pour une nouvelle partie.
 * @returns {void}
 */
function restartGame() {
  bankroll = STARTING_BANKROLL;
  selectedStake = DEFAULT_STAKE;
  roundStake = DEFAULT_STAKE;
  stakeInput.value = String(DEFAULT_STAKE);
  resetRound();
  setGameState(GAME_STATES.IDLE);
  renderHands();
  updateTotals();
  updateBankroll();
  showStartOverlay();
}

/**
 * Marque une main comme terminée et passe à la suivante.
 * @param {Hand} hand Main terminée.
 * @param {string} message Message affiché.
 * @returns {void}
 */
function finishHand(hand, message) {
  hand.status =
    calculateTotal(hand.cards) > 21 ? HAND_STATUSES.BUSTED : HAND_STATUSES.STOOD;
  setStatus(message);
  advanceToNextHand();
}

/**
 * Passe à la main suivante ou démarre le dealer.
 * @returns {void}
 */
function advanceToNextHand() {
  let nextIndex = activeHandIndex;

  while (nextIndex < playerHands.length) {
    const hand = playerHands[nextIndex];

    if (hand.status === HAND_STATUSES.PLAYING) {
      activeHandIndex = nextIndex;
      setGameState(GAME_STATES.PLAYER);
      setStatus("À vous de jouer avec " + getHandLabel(hand) + ".");
      renderHands();
      updateTotals();
      return;
    }

    nextIndex += 1;
  }

  activeHandIndex = Math.max(0, playerHands.length - 1);
  startDealerTurn();
}

/**
 * Programme le prochain tirage du dealer pour la donne courante.
 * @param {number} delay Délai avant le tirage.
 * @returns {void}
 */
function scheduleDealerDraw(delay) {
  scheduledDealerRoundId = roundId;
  window.setTimeout(runScheduledDealerDraw, delay);
}

/**
 * Exécute le tirage du dealer programmé.
 * @returns {void}
 */
function runScheduledDealerDraw() {
  drawNextDealerCard(scheduledDealerRoundId);
}

/**
 * Programme l'affichage de l'overlay de fin.
 * @param {string} message Message à afficher.
 * @param {number} delay Délai avant l'affichage.
 * @returns {void}
 */
function scheduleGameOverOverlay(message, delay) {
  scheduledOverlayRoundId = roundId;
  scheduledOverlayMessage = message;
  window.setTimeout(runScheduledGameOverOverlay, delay);
}

/**
 * Affiche l'overlay de fin si la donne est toujours active.
 * @returns {void}
 */
function runScheduledGameOverOverlay() {
  if (scheduledOverlayRoundId === roundId && gameState === GAME_STATES.OVER) {
    showGameOverOverlay(scheduledOverlayMessage);
  }
}

/**
 * Fait jouer le dealer après la fin des mains du joueur.
 * @returns {void}
 */
function startDealerTurn() {
  setGameState(GAME_STATES.DEALER);
  setStatus("Le dealer ouvre ses cartes.");
  revealDealer();
  scheduleDealerDraw(DEALER_FLIP_DELAY);
}

/**
 * Fait tirer le dealer jusqu'à atteindre au moins 17.
 * @param {number} currentRoundId Identifiant de la donne courante.
 * @returns {void}
 */
function drawNextDealerCard(currentRoundId) {
  if (currentRoundId !== roundId || gameState !== GAME_STATES.DEALER) {
    return;
  }

  if (isNatural(dealerCards)) {
    settleRound("Le dealer possède un blackjack naturel.");
    return;
  }

  const dealerTotal = calculateTotal(dealerCards);

  if (dealerTotal < DEALER_STAND_TOTAL) {
    const newCard = drawCard(deck);

    if (!newCard) {
      settleRound("La pioche est vide.");
      return;
    }

    dealerCards.push(newCard);
    renderHands({ dealerDeal: true });
    updateTotals();

    const updatedDealerTotal = calculateTotal(dealerCards);
    if (updatedDealerTotal > 21) {
      settleRound("Le dealer a dépassé 21.");
      return;
    }

    scheduleDealerDraw(DEALER_DRAW_DELAY);
    return;
  }

  settleRound(
    dealerTotal > 21
      ? "Le dealer a dépassé 21."
      : "Le dealer s’arrête à " + dealerTotal + ".",
  );
}

/**
 * Règle l'assurance comme un pari indépendant de la main principale.
 * @param {boolean} dealerHasBlackjack Indique si le dealer a un blackjack.
 * @returns {void}
 */
function settleInsurance(dealerHasBlackjack) {
  if (insuranceStatus === "taken") {
    if (dealerHasBlackjack) {
      insuranceNet = roundStake * INSURANCE_PAYOUT;
      bankroll += roundStake + insuranceNet;
    } else {
      insuranceNet = -roundStake;
    }
  } else if (insuranceStatus === "declined") {
    insuranceNet = 0;
  }
}

/**
 * Règle une main principale.
 * @param {Hand} hand Main à régler.
 * @param {number} dealerTotal Total final du dealer.
 * @param {boolean} dealerHasBlackjack Indique si le dealer a un blackjack.
 * @returns {void}
 */
function settleHand(hand, dealerTotal, dealerHasBlackjack) {
  const playerTotal = calculateTotal(hand.cards);
  const natural = isNaturalHand(hand);

  if (playerTotal > 21) {
    hand.result = "loss";
    hand.net = -hand.stake;
    return;
  }

  if (natural && dealerHasBlackjack) {
    hand.result = "push";
    hand.net = 0;
    bankroll += hand.stake;
    return;
  }

  if (natural && evenMoneyAccepted) {
    hand.result = "evenMoney";
    hand.net = hand.stake;
    bankroll += hand.stake * 2;
    return;
  }

  if (natural) {
    hand.result = "blackjack";
    hand.net = hand.stake * NATURAL_PAYOUT;
    bankroll += hand.stake + hand.net;
    return;
  }

  if (dealerHasBlackjack) {
    hand.result = "loss";
    hand.net = -hand.stake;
    return;
  }

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    hand.result = "win";
    hand.net = hand.stake * (WIN_PAYOUT_MULTIPLIER - 1);
    bankroll += hand.stake * WIN_PAYOUT_MULTIPLIER;
  } else if (playerTotal < dealerTotal) {
    hand.result = "loss";
    hand.net = -hand.stake;
  } else {
    hand.result = "push";
    hand.net = 0;
    bankroll += hand.stake;
  }
}

/**
 * Règle toutes les mains et l'assurance, puis termine la donne.
 * @param {string} message Message indiquant le résultat principal.
 * @returns {void}
 */
function settleRound(message) {
  if (gameState === GAME_STATES.OVER) {
    return;
  }

  revealDealer();
  const dealerHasBlackjack = isNatural(dealerCards);
  const dealerTotal = calculateTotal(dealerCards);

  settleInsurance(dealerHasBlackjack);

  for (const hand of playerHands) {
    settleHand(hand, dealerTotal, dealerHasBlackjack);
  }

  setGameState(GAME_STATES.OVER);
  const finalMessage = message + " Bilan : " + formatJetons(bankroll - roundStartBankroll);
  setStatus(finalMessage);
  renderHands();
  updateTotals();
  updateBankroll();
  scheduleGameOverOverlay(finalMessage, ROUND_END_OVERLAY_DELAY);
}

/**
 * Gère le bouton Tirer une carte.
 * @returns {void}
 */
function handlePlayerHit() {
  const hand = getActiveHand();

  if (
    gameState !== GAME_STATES.PLAYER ||
    !hand ||
    hand.status !== HAND_STATUSES.PLAYING ||
    calculateTotal(hand.cards) >= 21
  ) {
    return;
  }

  const newCard = drawCard(deck);

  if (!newCard) {
    settleRound("La pioche est vide.");
    return;
  }

  hand.cards.push(newCard);
  renderHands({ playerDeal: true, handId: hand.id });
  updateTotals();

  const playerTotal = calculateTotal(hand.cards);

  if (playerTotal > 21) {
    finishHand(hand, getHandLabel(hand) + " : vous avez dépassé 21.");
  } else if (playerTotal === 21) {
    hand.status = HAND_STATUSES.STOOD;
    setStatus(getHandLabel(hand) + " : 21, la main est terminée.");
    advanceToNextHand();
  } else {
    updateControls();
  }
}

/**
 * Gère le bouton Rester.
 * @returns {void}
 */
function handlePlayerStand() {
  const hand = getActiveHand();

  if (
    gameState !== GAME_STATES.PLAYER ||
    !hand ||
    hand.status !== HAND_STATUSES.PLAYING
  ) {
    return;
  }

  hand.status = HAND_STATUSES.STOOD;
  setStatus(getHandLabel(hand) + " : vous restez.");
  advanceToNextHand();
}

/**
 * Gère le bouton Doubler.
 * @returns {void}
 */
function handlePlayerDouble() {
  const hand = getActiveHand();

  if (!hand || !canDouble(hand)) {
    return;
  }

  const newCard = drawCard(deck);

  if (!newCard) {
    settleRound("La pioche est vide.");
    return;
  }

  const previousStake = hand.stake;
  hand.stake *= 2;
  hand.doubled = true;
  bankroll -= previousStake;
  hand.cards.push(newCard);
  renderHands({ playerDeal: true, handId: hand.id });
  updateTotals();
  updateBankroll();

  const playerTotal = calculateTotal(hand.cards);

  if (playerTotal > 21) {
    finishHand(hand, getHandLabel(hand) + " doublée : vous avez dépassé 21.");
  } else {
    hand.status = HAND_STATUSES.STOOD;
    setStatus(getHandLabel(hand) + " doublée : " + playerTotal + ".");
    advanceToNextHand();
  }
}

/**
 * Gère le bouton Séparer.
 * @returns {void}
 */
function handlePlayerSplit() {
  const hand = getActiveHand();

  if (!hand || !canSplit(hand)) {
    return;
  }

  const firstExtraCard = drawCard(deck);
  const secondExtraCard = drawCard(deck);

  if (!firstExtraCard || !secondExtraCard) {
    settleRound("La pioche est vide.");
    return;
  }

  const firstHand = createHand(
    [hand.cards[0], firstExtraCard],
    1,
    true,
  );
  const secondHand = createHand(
    [hand.cards[1], secondExtraCard],
    2,
    true,
  );
  const splitAces = hand.cards[0].label === "A";

  splitUsed = true;
  bankroll -= hand.stake;
  playerHands = [firstHand, secondHand];
  activeHandIndex = 0;

  if (splitAces) {
    for (const splitHand of playerHands) {
      splitHand.status = HAND_STATUSES.STOOD;
    }
  }

  renderHands({ playerDeal: true, handId: 1 });
  updateTotals();
  updateBankroll();

  if (splitAces) {
    setStatus("As séparés : chaque main reçoit une seule carte.");
    advanceToNextHand();
    return;
  }

  setStatus(getHandLabel(playerHands[0]) + " séparée : à vous de jouer.");
  setGameState(GAME_STATES.PLAYER);
  updateControls();
}

/**
 * Gère le choix d'assurance.
 * @param {boolean} acceptInsurance Indique si l'assurance est acceptée.
 * @returns {void}
 */
function handleInsuranceChoice(acceptInsurance) {
  if (gameState !== GAME_STATES.INSURANCE) {
    return;
  }

  if (acceptInsurance) {
    if (bankroll < roundStake) {
      setStatus("Solde insuffisant pour prendre l'assurance.");
      return;
    }

    insuranceStatus = "taken";
    bankroll -= roundStake;
    updateBankroll();
  } else {
    insuranceStatus = "declined";
  }

  if (resolveDealerBlackjack()) {
    return;
  }

  setGameState(GAME_STATES.PLAYER);
  setStatus("À vous de jouer.");
}

/**
 * Gère le choix d'even money.
 * @param {boolean} acceptEvenMoney Indique si l'even money est accepté.
 * @returns {void}
 */
function handleEvenMoneyChoice(acceptEvenMoney) {
  if (gameState !== GAME_STATES.EVEN_MONEY) {
    return;
  }

  evenMoneyAccepted = acceptEvenMoney;

  if (acceptEvenMoney) {
    settleRound("Even money accepté.");
    return;
  }

  if (resolveDealerBlackjack()) {
    return;
  }

  settleRound("Blackjack naturel !");
}

/**
 * Initialise le thème, l'affichage et l'état de départ.
 * @returns {void}
 */
function initialize() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton();
  resetRound();
  setGameState(GAME_STATES.IDLE);
  renderHands();
  updateTotals();
  updateBankroll();
  showStartOverlay();
}

/**
 * Accepte l'assurance proposée par la table.
 * @returns {void}
 */
function handleInsuranceAccept() {
  handleInsuranceChoice(true);
}

/**
 * Refuse l'assurance proposée par la table.
 * @returns {void}
 */
function handleInsuranceDecline() {
  handleInsuranceChoice(false);
}

/**
 * Accepte l'even money sur un blackjack naturel.
 * @returns {void}
 */
function handleEvenMoneyAccept() {
  handleEvenMoneyChoice(true);
}

/**
 * Refuse l'even money et conserve le paiement classique 3:2.
 * @returns {void}
 */
function handleEvenMoneyDecline() {
  handleEvenMoneyChoice(false);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
hitButton.addEventListener("click", handlePlayerHit);
standButton.addEventListener("click", handlePlayerStand);
doubleButton.addEventListener("click", handlePlayerDouble);
splitButton.addEventListener("click", handlePlayerSplit);
insuranceButton.addEventListener("click", handleInsuranceAccept);
declineInsuranceButton.addEventListener("click", handleInsuranceDecline);
evenMoneyButton.addEventListener("click", handleEvenMoneyAccept);
declineEvenMoneyButton.addEventListener("click", handleEvenMoneyDecline);
themeToggle.addEventListener("click", toggleTheme);
stakeInput.addEventListener("input", handleStakeInput);

initialize();
