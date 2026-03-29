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

We overlay the bonus cells on top of the board as

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

The rack as a list of tiles

```python
class Rack:
    tiles: list[str]
```

And the letter point values as a simple dict[str, int].

That gives us the basic building blocks to start with!

## Algorithm

The naive approach to generate the 'best' move for a given board state and rack of tiles is to brute force compute every possible word from our rack, and check every possible placement across the board state. This would be insanely inefficient though. Luckily for me, some people much smarter than I designed what is now the [canonical algorithm](https://www.cs.cmu.edu/afs/cs/academic/class/15451-s06/www/lectures/scrabble.pdf) for this problem space.
