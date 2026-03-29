---
title: "Crossplay Solver"
frameworks: [Python, Redis, Docker, Postgres, Marisa-trie, HTML, CSS, JS]
demo_url: "https://cp-solver.fly.dev/"
show_readme: false
---

CP Solver is an algorithmic solver for Crossplay, the Scrabble-esque NYT game.

## Backstory

I got obsessed with this game when NYT first released it. My girlfriend and I religiously play the other NYT games (Wordle, Crosswords, Connections, etc), so this was just the next obsession for us.

The concept is simple: 2 opposing players take turns using tiles to build words on a 15x15 grid, earnings points to win the match.

- Players begin with 7 tiles, hidden from their opponent
- When a tile is played, it gets replaced by another random tile from the tile bag
- Points are earned according to the rarity of the letter (e.g. Q > E) and where the word is placed on the board
- When the tile bag is empty, both players get one more turn before the game ends
- The player with the most points wins!

It's similar to Scrabble and Words With Friends, just with different letter values and bonus grid.

I started playing, but quickly found myself getting outclassed on every single match--even against the CPU on easy mode. Other players just seemed to be able to make more out of the same rack of letters!

That's when I had the idea to build a solver optimizer for the game, to help me get better.

## Problem Space

The game has quite a few dimensions that make it an interesting problem to solve:

- The board is a 15 x 15 grid of cells
- Each cell has a bonus value of 0 (no extra bonus), 2L (double letter), 3L (triple letter), 2W (double word), or 3W (triple word)
- User has 7 tiles at a time
- Each tile (letter) has a point value associated with it
- Users can place their tiles onto the board to make words
- Used tiles are replaced from a tile bag at random
- If a user uses all 7 of their tiles in a turn, they get a bingo point bonus
- Words are read downward and to the right
- A valid move must intersect at least one existing word
- Bonus cells are only calculated once--words that intersect a word on a bonus cell don't get the bonus benefit again
- Words can be placed in parallel, but every component word in the orthogonal direction must also be valid
- The first word must intersect the center of the board

## V1 design

I originally wanted the solver to have a screenshot-based interface. The idea was that a user could take a screenshot of the game, and the system would extract the game state (current board, tiles, etc) from that screenshot.

This proved to be MUCH harder than expected, mostly because screenshots don't follow a universal size standard. An iPhone screenshot might have a different size and aspect ratio compared to a Samsung, and hardcoding a bunch of screenshot 'formats' didn't seem like an elegant solution. The actual pipeline of extracting and inferring the board state from the screenshot was doable, but knowing where to set the extraction boundaries on the 50+ different phone models wasn't tenable. With that in mind, I reworked the design to be a text-based web UI.

## V2 design

Version 2 is a web UI that displays the 15 x 15 board. Users tap any cell to enter a letter tile, and the cursor automatically moves to the next cell to the right (mimicking the NYT crossword UX). While it can be a little tedious to enter in moves this way, it's by far the most accurate.

## Architecture

Python was my language choice for this project, mostly because it's the easiest to build within at this scope. There's a strong ecosystem for everything that I needed.

Setting up the initial game constraints was relatively easy. We represent each cell as

```python
class Cell:
  letter: str
  is_wildcard: bool
```

and the board as

```python
class Board:
    grid: list[list[Cell]] = field(
        default_factory=lambda: [
            [Cell() for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)
        ]
    )
```

We overlay the bonus cells on top of the board,

```python
_TW = BonusType.TRIPLE_WORD
_DW = BonusType.DOUBLE_WORD
_TL = BonusType.TRIPLE_LETTER
_DL = BonusType.DOUBLE_LETTER
_NN = BonusType.NONE
_SC = BonusType.SINGLE_CENTER

BONUS_GRID: list[list[BonusType]] = [
    [_TL, _NN, _NN, _TW, _NN, _NN, _NN, _DL, _NN, _NN, _NN, _TW, _NN, _NN, _TL],
    ...
]
```

init the rack as a list of tiles,

```python
class Rack:
    tiles: list[str]
```

and the letter point values as a simple dict of (str, int).

We represent the dictionary of valid words (~170k words) as a MARISA trie. This gives us a much smaller memory footprint than a standard dict, while retaining the raw lookup speed. Crucially, this gives us the ability to do prefix queries, which prune the tree aggressively—branches are abandoned as soon as no dictionary word can start with the current prefix.

That gives us the basic building blocks to start with!

## Algorithm

The naive approach to generate the 'best' move for a given board state and rack of tiles is to brute force compute every possible word from our rack, and check every possible placement across the board state. This would be insanely inefficient though. Luckily for me, some people much smarter than I designed what is now the [canonical algorithm](https://www.cs.cmu.edu/afs/cs/academic/class/15451-s06/www/lectures/scrabble.pdf) for this problem space.

### Anchors

Instead of brute forcing every possible option, we constraint our search space to only the cells that can actually hold a word. We call these cells anchors. Strictly, an anchor is an empty cell in which a new word can start or pass through. On a non-empty board, any empty cell adjacent to a filled cell is an anchor. On an empty board, only the center cell is an anchor.

### Cross-checks

We use anchors to do cross-checks. For each anchor, some letters are forbidden in the perpendicular direction because they don’t make a valid word. Cross-checks pre-compute, per cell, the set of letters that can legally be placed there without forming an invalid word in the other direction.

For example, if CAT runs horizontally at row 7, placing a tile at (8, 7) must form a valid word reading vertically: C?. Only letters that extend C into a real word are in the cross-check set for that cell.

### Move generation

To actually generate the list of valid moves, we do the following for each anchor, both vertically and horizontally:

Left side--tiles from the rack placed before the anchor, up to a length limit set by the gap to the previous anchor or board edge. Each candidate prefix is validated against the dictionary of valid words and cross-checks before recursing.

Right side--starting from the anchor, extend right or downward one cell at a time.

- If the cell is occupied, incorporate the existing tile and continue (the dictionary prefix check prunes dead ends).
- If the cell is empty, try every rack tile (and the ? wildcard for any letter) that is both a valid dictionary continuation and passes the cross-check for that cell.
- Record a move whenever the partial word is a complete dictionary word, has passed through the anchor, and at least one rack tile was placed.

### Scoring

After move generation, we dedupe—the same word at the same position can be found via multiple anchors. Each unique move is then scored:

1. Per-tile face values
2. Letter multipliers (2L, 3L) applied to new tiles
3. Word multipliers (2W, 3W) applied if any placed tile lands on a word bonus cell
4. Bingo bonus of +40 points if all 7 tiles are used in one move

The top N (default 20) moves are returned in score descending order. The user can tap on a move in the UI to see its place on the board, and can optionally apply the move directly to the board.

## Auth

Auth for this project was fun to solve. I wanted users to be able to create games and try the system without creating an account, and I REALLY didn't want to require users to enter any personal info in the account creation process.

The solution I resolved on was to allow users to use the system within a browser session, identified by the Flask secret and a cookie. This lets users create, update, and delete their games within the browser session, and if they want real persistence, they can create an account with a username and password. No email or personal info is required. We enforce username uniqueness constraints, and recovery codes are generated and shown at account create time in case the user forgets their password.

## Other features

- Redis for token bucket rate limiting
- Vintage board game-looking UI (I'm not a designer lol)

## Limitations

- Occasionally, a returned move isn’t recognized as valid by the NYT game. This is generally due to deltas in the dictionary of allowed words that I’m using and the dictionary that NYT uses. NYT uses the NASPA wordlist, which requires a membership fee to be able to access. I’m using an open source list which occasionally returns words not allowed by NYT. (I can’t remember who exactly I got the list from; if I remember the repo I’ll give them credit here).
- The system currently only supports NYT crossplay. I'd like to extend support to Words with Friends, Scrabble, and other similar games. Most of this comes down to switching the dictionary, grid size/bonus layout, and letter point values, so it _should_ be relatively easy.
