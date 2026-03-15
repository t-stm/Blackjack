# Blackjack

---

## Table of Contents

- [Purpose of the application](#purpose-of-the-application)
- [Quickstart](#quickstart)
- [Technical Description](#technical-description)
  - [Requirements](#requirements)
  - [Dependencies](#dependencies)
  - [Architecture](#architecture)
  - [Supporting objects](#supporting-objects)
    - [COUNT](#count)
    - [TEXT](#text)
    - [USER\_INPUT](#user_input)
  - [class Card](#class-card)
  - [class Deck](#class-deck)
  - [class Hand](#class-hand)
  - [class Contestant](#class-contestant)
    - [class Player](#class-player)
    - [class Dealer](#class-dealer)
  - [class Round](#class-round)
  - [class Game](#class-game)

---

## Purpose of the application

This application is a terminal-based implementation of the card game Blackjack. The objective is to draw cards until the total value of the contestant's hand is as close as possible to 21 without exceeding it. When the value of a contestant's hand exceeds 21, they will 'bust' and lose the game. The game is played by a player and a dealer. At the start of each round, the player and the dealer are each dealt two cards. The dealer reveals one of their cards. The player then chooses to either hit (draw another card) or stay (end their turn). Once the player has stayed, the dealer plays out their own turn according to a fixed rule: they must stay once their score reaches 17. The winner is determined by comparing scores at the end of the round.

---

## Quickstart

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/t-stm/Blackjack
cd Blackjack

# 2. Install dependencies
npm install

# 3. Start the application
node blackjack.js
```

---

## Technical Description

### Requirements

| Tool | Version |
|---|---|
| Node.js | v22.17.0 |

### Dependencies

| Package | Version |
|---|---|
| readline-sync | 1.4.10 |

Install all dependencies with:

```bash
npm install
```

### Architecture

The application is organised into two layers: a set of **supporting objects** that handle text output, colour formatting and user input, and a set of **game classes** that model the entities and logic of the game itself.

| Layer | File(s) | Role |
|---|---|---|
| Supporting | `blackjack.js` (`COUNT`, `TEXT`, `USER_INPUT`) | Text formatting, colour output, user input handling |
| Game logic | `blackjack.js` (`Card`, `Deck`, `Hand`, `Contestant`, `Player`, `Dealer`, `Round`, `Game`) | Game entities, rules, and round/game flow |

All code lives in a single file, `blackjack.js`. The `Game` class is instantiated at the bottom of the file and its `start()` method launches the application.

---

## Supporting objects

### COUNT

A utility object with a single method, `tallyFromArray(arr)`, which takes an array and returns an object that maps each unique element to the number of times it appears in the array. It is used internally by `USER_INPUT` to identify which leading substrings of a set of options are unambiguous.

### TEXT

A frozen object that centralises all text formatting and terminal output for the application. It uses ANSI escape codes (stored in `TEXT.COLORS`) to colour output in the terminal. Key methods include:

- `colorString(str, color)` — wraps a string in the given ANSI colour code and a reset sequence, so the colour applies only to that string.
- `prompt(promptString, color)` — prints a `>>>` -prefixed message to the console, optionally in colour.
- `quote(quoteString)` — wraps a string in single quotes.
- `addAorAn(inputStr)` — prepends `a` or `an` to a string based on whether it starts with a vowel.
- `pluralize(singularNoun, count)` — returns a string consisting of the count and the noun, suffixed with an `s` if the noun is plural.
- `advancedJoin(stringsArray, mainDelimiter, finalDelimiter)` — joins an array of strings with a main delimiter between all but the last element, and a different final delimiter before the last element (e.g. `'hit', 'stay'or'something'`). Used throughout to construct readable lists in prompts.
- `presentOptions(optionsArr)` — formats an array of options as a quoted, joined string for display in user input prompts.
- `leadingSubstrings(inputString)` — returns an array of all leading substrings of a string (e.g. `'h'`, `'hi'`, `'hit'` for `'hit'`). Used by `USER_INPUT` to determine minimum valid input lengths.

Colour values for suits, contestants, and game states (win, lose, invalid) are assigned to `TEXT.COLORS` after the relevant classes are defined, then frozen.

### USER_INPUT

A frozen object that handles all user input for the application. It uses `readline-sync` to read synchronous input from the terminal. Key methods include:

- `initValidSubstringsPerOption(stringsArr)` — for each option in a given array, it computes all leading substrings and then uses `COUNT.tallyFromArray` to identify the shortest leading substring that is unique to that option. This means that a user can type just enough characters to unambiguously identify their choice.
- `initValidResponsesPerOption(optionsArr)` — builds on `initValidSubstringsPerOption` by adding the full option string itself as a valid response for each option.
- `getResponse(optionsArr)` — presents the user with a prompt listing the valid options, reads their input, and loops until a valid response is entered. It then uses `lookupChosenOption` to return the full option string that corresponds to the user's input.
- `lookupChosenOption(chosenOption, validResponsesPerOption)` — given a user's response and a map of valid responses per option, returns the full option string that the response corresponds to.
- `getYesNo()` — calls `getResponse` with `Yes` and `No` as options.
- `respondedYes(response)` — returns `true` if the response is `Yes`.
- `askToProceed()` — prompts the user to press Enter and then clears the terminal.

---

## class Card

Represents a single playing card. Each card has four private attributes:

- `suit` — one of `spades`, `clubs`, `diamonds`, or `hearts` (defined in the frozen `Card.SUITS` static property)
- `rank` — one of thirteen ranks from `two` to `ace` (derived from `Card.RANK_VALUES`)
- `value` — the numeric value of the card; number cards are worth their face value, face cards are worth 10, and aces are initially unvalued (`null`)
- `hidden` — a boolean that determines whether the card is shown to the player

The `value` setter ensures that only aces can be revalued, and only to `ACE_MIN` (1) or `ACE_MAX` (11). The `hide()` and `unhide()` methods toggle the `hidden` attribute. The `info` getter returns a colour-coded string describing the card (e.g. `an ace of spades`), using `TEXT.COLORS` to colour each card by suit.

`Card.RANKS` is a static getter that derives a ranks object directly from the keys of `Card.RANK_VALUES`, ensuring that rank names are always consistent with the values table.

---

## class Deck

Represents a standard 52-card deck. The deck is initialised and shuffled in the constructor. 

- `#initialize()` — creates one `Card` instance for every combination of suit and rank, then calls `shuffle()`.
- `shuffle()` — shuffles the deck by iterating from the end of the cards array and swapping each card with a randomly selected card at a lower index.
- `draw()` — removes and returns the first card in the deck.

---

## class Hand

Represents the set of cards held by a contestant. Key methods include:

- `add(card)` — adds a card to the hand, triggers a score update, and sorts the hand by card value if no hidden cards are present.
- `#calcScore()` — computes the hand's score as the sum of all card values.
- `#updateScore()` — extends `#calcScore` to handle aces. It first assigns all aces their maximum value (11) and then downgrades them one by one to their minimum value (1) in cases where the hand would otherwise bust.
- `unhideAllCards()` — reveals all hidden cards and sorts the hand.
- `genCardsInHandString()` — returns a formatted string describing the cards in the hand, distinguishing between visible and hidden cards (e.g. `an ace of spades and 2 hidden cards`).
- `genAcesInfoStrings()` — returns a formatted string describing the current value assigned to each ace in the hand.

---

## class Contestant

An abstract super class for `Player` and `Dealer`. It defines shared behaviour:

- `addToHand(card)` — adds a card to the contestant's hand and calls `displayCard`.
- `hasAces()` — returns `true` if the hand contains at least one ace.
- `displayAcesInfo()` — prints information about the current value of each ace in the hand.
- `showHand()` — displays the cards in the hand; if no hidden cards are present, it also shows aces info (if applicable) and the hand's total score.

Two static properties are defined on `Contestant`:

- `TARGET_SCORE` — set to 21, the score that contestants aim to reach without exceeding.
- `CHOICES` — a frozen object containing `hit` and `stay` as the two possible moves.

### class Player

Extends `Contestant`. Represents the human player. The player's hand, score, colour, and busted status are stored as private fields. Key methods include:

- `choose()` — prompts the user to select `hit` or `stay` using `USER_INPUT.getResponse`.
- `updateBusted()` — sets the `#busted` flag to `true` if the player's score exceeds `TARGET_SCORE`.
- Display methods (`displayCard`, `displayCardsInHand`, `displayScore`, `announceTurn`, `announceHit`, `announceStay`) — print contextual messages to the terminal in the player's colour (yellow).

### class Dealer

Extends `Contestant`. Represents the dealer, whose behaviour is automated. The dealer follows a fixed rule: they must stay once their score reaches `MUST_STAY` (17). Key differences from `Player` include:

- `choose()` — returns `stay` if the dealer's score is at or above `MUST_STAY`, otherwise returns `hit`. No user input is required.
- `displayCard(card)` — shows a hidden card message when the card is hidden, and the card's full info when it is not.
- Display methods output messages in the dealer's colour (blue).


---

## class Round

Manages a single round of Blackjack. It holds references to the `Player`, `Dealer`, and a freshly initialised `Deck`. Key methods include:

- `#dealHands()` — deals two cards to each contestant. The dealer's second card is dealt face-down (hidden).
- `#hit()` — announces the hit, deals one card to the current contestant, and prompts the user to proceed.
- `#chooseMove()` — calls `choose()` on the current contestant and executes a hit or stay accordingly.
- `#execPlayerTurn()` — runs the player's turn in a loop, showing both hands and prompting for a move each iteration, until the player stays or busts.
- `#execDealerTurn()` — runs the dealer's turn in a loop after the player's turn is complete. The dealer's hand is fully revealed before this turn begins.
- `#determineOutcome()` — compares scores and bust states to determine the round's outcome, returning one of five possible outcomes: `win`, `lose`, `tie`, `playerBusted`, or `dealerBusted`.
- `#displayRoundOutcome()` — shows both hands and prints the outcome string, colour-coded green for a win and red for a loss.
- `play()` — orchestrates the full round by calling the above methods in sequence.

---

## class Game

The top-level class that initialises and runs the application. It creates one `Player` and one `Dealer` instance in its constructor. Key methods include:

- `displayGameWelcome()` — prints a welcome message explaining the objective and available moves.
- `displayGameGoodbye()` — prints a farewell message.
- `start()` — displays the welcome message, creates a new `Round`, plays it, and then displays the goodbye message.

A single `Game` instance is created at the bottom of the file and `start()` is called to launch the application.
