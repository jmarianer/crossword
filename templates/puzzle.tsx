import * as React from './noreact';
import base = require('./base');
import crosswordTable = require('./crossword-table');
import { Clue, ClueDirection, Puzzle } from '../types';

function showClue(clue: Clue, l10n: any) {
  return (
    <span class={ clue.clueNumber + ClueDirection[clue.direction] + ' clue' }
       data-row={ clue.initialPosition.row }
       data-col={ clue.initialPosition.col }
       data-direction = { ClueDirection[clue.direction] }>
      { clue.clueNumber }. { clue.clue !== '' ? clue.clue : l10n.noClue }{ ' ' }
    </span>);
}

function showClues(puzzle: Puzzle, direction: ClueDirection, l10n: any) {
  return puzzle.clues
        .filter((clue) => clue.direction === direction)
        .map((clue) => showClue(clue, l10n));
}

export = (id: string, puzzle: Puzzle, l10n: any) => base(
  'crossword.js',
  l10n,
  <a href={ `/share/${ id }` } class='hamburger'></a>,
  crosswordTable(id, puzzle),
  <div class='clues'>
    <b>{ l10n.across }:</b>
    { showClues(puzzle, ClueDirection.across, l10n) }
    <br />
    <b>{ l10n.down }:</b>
    { showClues(puzzle, ClueDirection.down, l10n) }
  </div>,
);
