// SUPPORTING METHODS
const readlineSync = require('readline-sync');

const COUNT = {
  tallyFromArray(arr) {
    let tally = {};

    arr.forEach(element => {
      if (tally.hasOwnProperty(element)) {
        tally[element] += 1;
      } else {
        tally[element] = 1;
      }
    });

    return tally;
  },
};

const TEXT = Object.freeze({
  COLORS: {},
  VOWELS: 'aeiou',

  colorString(str, color = '') {
    let colorEnding = color ? TEXT.COLORS['ending'] : '';
    let colorBeginning = color;

    return `${colorBeginning}${str}${colorEnding}`;
  },

  prompt(promptString, color = '') {
    let coloredString = TEXT.colorString(promptString, color);

    console.log(`>>> ${coloredString}`);
  },

  quote(quoteString) {
    return `'${quoteString}'`;
  },

  addAorAn(inputStr) {
    if (inputStr.length === 0) return inputStr;
    
    let firstChar = inputStr[0].toLowerCase();
    if (TEXT.VOWELS.includes(firstChar)) return `an ${inputStr}`;
    return `a ${inputStr}`;
  },
  
  pluralize(singularNoun, count) {
    if (count !== 1) return `${count} ${singularNoun}s`;
    return `${count} ${singularNoun}`;
  },

  advancedJoin(stringsArray, mainDelimiter = ',', finalDelimiter = 'or') {
    let finalIndex = stringsArray.length - 1;

    if (finalIndex === 0) return stringsArray[finalIndex];

    return stringsArray
      .slice(0, finalIndex)
      .join(mainDelimiter) + finalDelimiter + stringsArray[finalIndex];
  },

  presentOptions(optionsArr) {
    let quotedOps = optionsArr.map(option => TEXT.quote(option.toLowerCase()));
    return this.advancedJoin(quotedOps);
  },

  leadingSubstrings(inputString) {
    let substringsArr = [];
    
    for (let j = 1; j <= inputString.length; j += 1) {
      let substring = inputString.slice(0, j);
      substringsArr.push(substring);
    }

    return substringsArr;
  },
});

TEXT.COLORS['win'] = '\x1b[32m';
TEXT.COLORS['lose'] = '\x1b[31m';
TEXT.COLORS['invalid'] = '\x1b[41m';
TEXT.COLORS['ending'] = '\x1b[0m';

const USER_INPUT = Object.freeze({
  getResponse(optionsArr) {
    let validResponsesPerOption = this.initValidResponsesPerOption(optionsArr);
    let validResponses = Object.values(validResponsesPerOption).flat();

    while (true) {
      let userResponse = readlineSync
        .question(`Please enter ${TEXT.presentOptions(optionsArr)}: `)
        .trim()
        .toLowerCase();

      if (validResponses.includes(userResponse)) {
        return this.lookupChosenOption(userResponse, validResponsesPerOption);
      }

      TEXT.prompt(`Sorry, invalid response. Valid responses include: ${TEXT.presentOptions(validResponses.sort())}.`, TEXT.COLORS['invalid']);
    }
  },

  lookupChosenOption(chosenOption, validResponsesPerOption) {
    for (let option in validResponsesPerOption) {
      if (validResponsesPerOption[option].includes(chosenOption)) return option;
    }

    return '';
  },

  initValidSubstringsPerOption(stringsArr) {
    let substringsOfStrings = {};

    stringsArr.forEach(string => {
      substringsOfStrings[string] = TEXT.leadingSubstrings(string);
    });

    let substringsTally = COUNT
      .tallyFromArray(Object.values(substringsOfStrings).flat());

    for (let str in substringsOfStrings) {
      let substrings = substringsOfStrings[str];

      for (let currSubstring of substrings) {
        if (substringsTally[currSubstring] === 1) {
          substringsOfStrings[str] = [currSubstring];
          break;
        }
      }
    }

    return substringsOfStrings;
  },

  initValidResponsesPerOption(optionsArr) {
    let validResponsesPerOption = this.initValidSubstringsPerOption(optionsArr);

    for (let option in validResponsesPerOption) {
      validResponsesPerOption[option] = validResponsesPerOption[option]
        .map(response => response.toLowerCase());
      validResponsesPerOption[option].push(option.toLowerCase());
    }

    return validResponsesPerOption;
  },

  affirmativeResponse: 'Yes',

  negativeResponse: 'No',

  getYesNo() {
    return this.getResponse([this.affirmativeResponse, this.negativeResponse]);
  },

  respondedYes(response) {
    return response === this.affirmativeResponse;
  },

  askToProceed() {
    readlineSync.question(`Please hit 'enter' to proceed...`);
    console.clear();
  }
});

class Contestant {
  static #CHOICES = Object.freeze({hit: 'hit', stay: 'stay'});
  static get CHOICES() {
    return this.#CHOICES;
  }

  static #TARGET_SCORE = 21;
  static get TARGET_SCORE() {
    return this.#TARGET_SCORE;
  }

  constructor() {
  }

  addToHand(card) {
    this.hand.add(card);
    this.displayCard(card);
  }

  hasAces() {
    let aces = this.hand.getAces();
    return aces.length > 0;
  }

  displayAcesInfo() {
    TEXT.prompt(`The ${this.hand.genAcesInfoStrings()}${TEXT.colorString('.', this.color)}`, this.color);
  }

  showHand() {
    this.displayCardsInHand();

    if (!this.hand.hasHiddenCards()) {
      if (this.hasAces()) {
        this.displayAcesInfo();
      }

      this.displayScore();
    }
  }
}

class Player extends Contestant {
  #hand;
  #busted;
  #color;

  constructor() {
    super();
    this.#hand = new Hand();
    this.#color = TEXT.COLORS['player'];
    this.#hand.color = this.color;
    this.#busted = false;
  }

  get hand() {
    return this.#hand;
  }
  
  get color() {
    return this.#color;
  }

  get score() {
    return this.#hand.score;
  }

  get busted() {
    return this.#busted;
  }

  updateBusted() {
    if (this.score > Contestant.TARGET_SCORE) {
      this.#busted = true;
    }
  }

  displayCard(card) {
    TEXT.prompt(`You've been dealt ${card['info']}${TEXT.colorString('.', this.#color)}`, this.#color);
  }

  displayCardsInHand() {
    TEXT.prompt(`You have ${this.#hand.genCardsInHandString()} ${TEXT.colorString('in your hand.', this.#color)}`, this.#color);
  }

  displayScore() {
    TEXT.prompt(`The total value of your hand is ${TEXT.pluralize('point', this.score)}.`, this.#color);
  }

  choose() {
    TEXT.prompt(`Would you like to hit or stay?`);
    let choice = USER_INPUT.getResponse(Object.values(Contestant.CHOICES));
    console.clear();
    return choice; 
  }

  announceTurn() {
    TEXT.prompt(`It's your turn!`, this.#color);
  }

  announceHit() {
    TEXT.prompt(`You've chosen to hit.`, this.#color);
  }

  announceStay() {
    TEXT.prompt(`You've chosen to stay at ${TEXT.pluralize('point', this.score)}.`, this.#color);
  }
}

class Dealer extends Contestant {  
  #hand;
  #busted;
  #color;

  static #MUST_STAY = 17;
  static get MUST_STAY() {
    return this.#MUST_STAY;
  }

  constructor() {
    super();
    this.#hand = new Hand();
    this.#color = TEXT.COLORS['dealer'];
    this.#hand.color = this.color;
    this.#busted = false;
  }

  get hand() {
    return this.#hand;
  }

  get color() {
    return this.#color;
  }

  get score() {
    return this.#hand.score;
  }

  get busted() {
    return this.#busted;
  }

  updateBusted() {
    if (this.score > Contestant.TARGET_SCORE) {
      this.#busted = true;
    }
  }

  displayCard(card) {
    switch(card['hidden']) {
      case true:
        TEXT.prompt(`The dealer has been dealt a hidden card.`, this.color);
        break;
      case false:
        TEXT.prompt(`The dealer has been dealt ${card['info']}${TEXT.colorString('.', this.color)}`, this.color);
        break;
      default:
        TEXT.prompt(`ERROR: can't determine whether this card is hidden or not.`, TEXT.COLORS['invalid']);
    }
  }

  displayCardsInHand() {
    TEXT.prompt(`The dealer has ${this.#hand.genCardsInHandString()} ${TEXT.colorString('in their hand.', this.#color)}`, this.#color);
  }

  displayScore() {
    TEXT.prompt(`The total value of the dealer's hand is ${TEXT.pluralize('point', this.score)}.`, this.#color);
  }

  choose() {
    if (this.score >= Dealer.MUST_STAY) return Contestant.CHOICES['stay'];
    return Contestant.CHOICES['hit'];
  }

  announceTurn() {
    TEXT.prompt(`It's the dealer's turn!`, this.#color);
  }

  announceHit() {
    TEXT.prompt(`The dealer chose to hit.`, this.#color);
  }

  announceStay() {
    TEXT.prompt(`The dealer chose to stay at ${TEXT.pluralize('point', this.score)}.`, this.#color);
    USER_INPUT.askToProceed();
  }
}

class Hand {
  #cards;
  
  constructor() {
    this.#cards = [];
  }

  get cards() {
    return this.#cards;
  }

  sort() {
    this.cards.sort((card1, card2) => card1['value'] - card2['value']);
  }

  getAces() {
    let aces = this.cards.filter(card => card['rank'] === Card.RANKS['ace']);
    return aces;
  }

  #calcScore() {
    this.score = this.cards.reduce((sum, card) => sum + card['value'], 0);
  }

  #updateScore() {    
    let aces = this.getAces();

    if (aces.length === 0) {
      this.#calcScore();
      return;
    }

    aces.forEach(ace => ace['value'] = Card.ACE_MAX);
    this.#calcScore();

    for (let ace of aces) {
      if (this.score > Contestant.TARGET_SCORE) {
        ace['value'] = Card.ACE_MIN;
        this.#calcScore();
      }
    }
  }

  hasHiddenCards() {
    return this.cards.some(card => card['hidden'] === true);
  }

  unhideAllCards() {
    this.cards.forEach(card => card.unhide());
    this.sort();
  }

  genAcesInfoStrings() {
    let aces = this.getAces();
    let acesInfoStrings = aces.map(ace => `${TEXT.colorString(`ace of ${ace['suit']}`, TEXT.COLORS[ace['suit']])} ${TEXT.colorString(`is worth ${TEXT.pluralize('point', ace['value'])}`, this.color)}`);
    return TEXT.advancedJoin(acesInfoStrings, `${TEXT.colorString(', the ', this.color)}`, TEXT.colorString(' and the ', this.color));
  }

  add(card) {
    this.cards.push(card);
    this.#updateScore();
    if (!this.hasHiddenCards()) {
      this.sort();
    }
  }

  #joinWithFinal(finalDelimiter, cardStrings) {
    return TEXT.advancedJoin(cardStrings, TEXT.colorString(', ', this.color), TEXT.colorString(finalDelimiter, this.color));
  }

  genCardsInHandString() {
    let hiddenCards = this.cards.filter(card => card['hidden']);
    let hiddenCardsCount = hiddenCards.length;

    let unhiddenCards = this.cards.filter(card => !card['hidden']);
    let cardStrings = unhiddenCards.map(card => card['info']);
    
    let hiddenCardsString = hiddenCardsCount > 0 ? TEXT.colorString(` and ${TEXT.pluralize('hidden card', hiddenCardsCount)}`, this.color) : '';
    let unhiddenCardsString = hiddenCardsCount > 0 ? this.#joinWithFinal(', ', cardStrings) : this.#joinWithFinal(' and ', cardStrings);

    return unhiddenCardsString + hiddenCardsString;
  }
}

class Card {
  #suit;
  #rank;
  #value;
  #hidden;

  static #SUITS = Object.freeze({spades: 'spades', clubs: 'clubs', diamonds: 'diamonds', hearts: 'hearts'});
  static get SUITS() {
    return this.#SUITS;
  }
  
  static #UNVALUED_ACE = null;
  static get UNVALUED_ACE() {
    return this.#UNVALUED_ACE;
  }

  static #ACE_MIN = 1;
  static get ACE_MIN() {
    return this.#ACE_MIN;
  }

  static #ACE_MAX = 11;
  static get ACE_MAX() {
    return this.#ACE_MAX;
  }

  static #RANK_VALUES = Object.freeze({two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, jack: 10, queen: 10, king: 10, ace: Card.UNVALUED_ACE});
  static get RANK_VALUES() {
    return this.#RANK_VALUES;
  }



  static get RANKS() {
    let ranks = {}
    Object.keys(this.#RANK_VALUES).forEach(rank => ranks[rank] = rank);
    return Object.freeze(ranks);
  }
  
  constructor(suit, rank, value) {
    this.#suit = suit,
    this.#rank = rank,
    this.#value = value,
    this.#hidden = false
  }

  get info() {
    return TEXT.colorString(`${TEXT.addAorAn(this.#rank)} of ${this.#suit}`, TEXT.COLORS[this.#suit]);
  }

  get rank() {
    return this.#rank;
  }

  get suit() {
    return this.#suit;
  }

  get value() {
    return this.#value;
  }

  set value(targetValue) {
    if (this.#rank !== Card.RANKS['ace']) {
      TEXT.prompt('Error: Only aces can be revalued. This card is not an ace.', TEXT.COLORS['invalid']);
      return;
    }

    if (![Card.ACE_MAX, Card.ACE_MIN].includes(targetValue)) {
      prompt(`Error: an ace's value can only be set to ${Game.ACE_MIN} or ${Game.ACE_MAX}.`, TEXT.COLORS['invalid']);
      return;
    }

    this.#value = targetValue;
  }

  hide() {
    this.#hidden = true;
  }

  unhide() {
    this.#hidden = false;
  }

  get hidden() {
    return this.#hidden;
  }
}

class Deck {
  #cards;

  constructor() {
    this.#initialize();
  }

  shuffle() {
    let cardCount = this.#cards.length;

    for (let lastCard = cardCount; lastCard > 0; lastCard -= 1) {
      let selectedCardIndex = Math.floor(Math.random() * lastCard);
      let selectedCard = this.#cards.splice(selectedCardIndex, 1);
      this.#cards.push(selectedCard[0]);
    }
  }

  #initialize() {
    this.#cards = [];
    Object.keys(Card.SUITS).forEach(suit => {
      for (let rank in Card.RANKS) {
        this.#cards.push(new Card(suit, rank, Card.RANK_VALUES[rank]));
      }
    });

    this.shuffle();
  }
  
  draw() {
    return this.#cards.shift();
  }
}

class Round {
  #player;
  #dealer;
  #deck
  #outcome
  #currContestant;
  
  static #OUTCOME_STRINGS = Object.freeze({
    tie: `It's a tie`, 
    win: TEXT.colorString(`Congratulations, you've won this round!`, TEXT.COLORS['win']),
    lose: TEXT.colorString(`You've lost this round.`, TEXT.COLORS['lose']),
    playerBusted: TEXT.colorString(`You busted. The dealer wins this round.`, TEXT.COLORS['lose']), 
    dealerBusted: TEXT.colorString(`The dealer busted. You win this round!`, TEXT.COLORS['win']),
  });
  static get OUTCOME_STRINGS() {
    return this.#OUTCOME_STRINGS;
  }

  static #extractOutcomes = function() {
    let outcomes = {}
    Object.keys(this.#OUTCOME_STRINGS).forEach(outcome => outcomes[outcome] = outcome);
    Object.freeze(outcomes);
    return outcomes;
  }

  static #OUTCOMES = this.#extractOutcomes();
  static get OUTCOMES() {
    return this.#OUTCOMES;
  }

  constructor(player, dealer) {
    this.#player = player,
    this.#dealer = dealer,
    
    this.#deck = new Deck();
    
    this.#outcome = null;
  }

  #displayRoundWelcome() {
    TEXT.prompt(`Welcome to this round of ${Game.NAME}!`);
    USER_INPUT.askToProceed();
  }

  #dealCard(hide = '') {
    let drawnCard = this.#deck.draw();
    if (hide) {
      drawnCard.hide();
    }
    this.#currContestant.addToHand(drawnCard);
    this.#currContestant.updateBusted();
  }

  #dealHands() {
    TEXT.prompt('Dealing two cards to each contestant...');
    [this.#dealer, this.#player].forEach(contestant => {
      this.#currContestant = contestant;
      this.#dealCard()
      this.#currContestant === this.#dealer ? this.#dealCard('hide') : this.#dealCard();
    });
    USER_INPUT.askToProceed();
  }

  #hit() {
    this.#currContestant.announceHit();
    this.#dealCard();
    USER_INPUT.askToProceed();
  }

  #chooseMove() {
    let choice = this.#currContestant.choose();
    
    switch (choice) {
      case Contestant.CHOICES['stay']:
        this.#currContestant.announceStay();
        return Contestant.CHOICES['stay'];
      case Contestant.CHOICES['hit']:
        this.#hit();
        return Contestant.CHOICES['hit'];
      default:
        TEXT.prompt('ERROR: Choice cannot be recognized.');
        return '';
    }
  }

  #execPlayerTurn() {
    this.#currContestant = this.#player;

    while (true) {
      this.#player.announceTurn();
      this.#player.showHand();
      this.#dealer.showHand();
      let choice = this.#chooseMove();
      if (choice === '') return;
      if (choice === Contestant.CHOICES['stay']) break;
      if (this.#player.busted) break;
    }
  }

  #execDealerTurn() {
    this.#currContestant = this.#dealer;
    this.#dealer.announceTurn();
    USER_INPUT.askToProceed();

    while (true) {
      this.#player.announceStay();
      this.#dealer.announceTurn();
      this.#dealer.showHand();
      USER_INPUT.askToProceed(); 
      let choice = this.#chooseMove();
      if (choice === Contestant.CHOICES['stay']) break;
      if (this.#dealer.busted) break;
    }
  }

  #determineOutcome() {
    if (this.#player.busted) return Round.OUTCOMES['playerBusted'];
    if (this.#dealer.busted) return Round.OUTCOMES['dealerBusted'];
    if (this.#player.score > this.#dealer.score) return Round.OUTCOMES['win'];
    if (this.#dealer.score > this.#player.score) return Round.OUTCOMES['lose'];
    return Round.OUTCOMES['tie'];
  }

  #displayRoundOutcome() {
    TEXT.prompt('This round is over.');
    [this.#player, this.#dealer].forEach(contestant => contestant.showHand());
    if (!this.#outcome) {
      TEXT.prompt('Outcome unclear', TEXT.COLORS['invalid']);
    }
    TEXT.prompt(Round.OUTCOME_STRINGS[this.#outcome]);
  }

  play() {
    this.#displayRoundWelcome();
    this.#dealHands();
    this.#execPlayerTurn();
    this.#dealer.hand.unhideAllCards();

    if (!this.#player.busted) {
      this.#execDealerTurn();
    } 

    this.#outcome = this.#determineOutcome();
    this.#displayRoundOutcome();
  }
}

class Game {
  #player;
  #dealer;

  static #NAME = 'Blackjack';
  static get NAME() {
    return this.#NAME;
  }

  static #CONTESTANTS = Object.freeze({player: 'player', dealer: 'dealer'});
  static get CONTESTANTS() {
    return this.#CONTESTANTS;
  }
  
  constructor() {
    Object.keys(Game.CONTESTANTS).forEach(contestant => {
      switch (contestant) {
        case Game.CONTESTANTS['player']:
          this.#player = new Player();
          break;
        case Game.CONTESTANTS['dealer']:
          this.#dealer = new Dealer();
          break;
        default:
          TEXT.prompt('ERROR: requested contestant not recognized. Cannot initialize.', TEXT.COLORS['invalid']);
      }
    })
  }
  
  displayGameWelcome() {
    TEXT.prompt(`Welcome to this game of ${Game.NAME}!`);
    TEXT.prompt(`The objective of the game is to get as close as possible to ${TEXT.pluralize('point', Contestant.TARGET_SCORE)} without exceeding this number.`);
    TEXT.prompt(`You can draw a card by selecting ${TEXT.quote(Contestant.CHOICES['hit'])} and end your turn by selecting ${TEXT.quote(Contestant.CHOICES['stay'])}.`);
  }

  displayGameGoodbye() {
    USER_INPUT.askToProceed();
    TEXT.prompt(`Thank you for playing ${Game.NAME}! Goodbye!`);
  }

  start() {
    this.displayGameWelcome();
    USER_INPUT.askToProceed();
    let round = new Round(this.#player, this.#dealer);
    round.play();
    this.displayGameGoodbye();
  }
}

// SUPPORTING CODE

TEXT.COLORS[Game.CONTESTANTS['dealer']] = '\x1b[34m';
TEXT.COLORS[Game.CONTESTANTS['player']] = '\x1b[33m';
TEXT.COLORS[Card.SUITS['spades']] = '\x1b[30m';
TEXT.COLORS[Card.SUITS['clubs']] = '\x1b[30m';
TEXT.COLORS[Card.SUITS['hearts']] = '\x1b[31m';
TEXT.COLORS[Card.SUITS['diamonds']] = '\x1b[31m';
Object.freeze(TEXT.COLORS);


// RUN GAME

let game = new Game();
game.start();
