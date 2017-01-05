import * as React from './noreact';
import base = require('./base');
import { Clue, Puzzle, ClueDirection } from '../types';

function showClue(clue: Clue, l10n: any) {
  return (
    <tr>
      <th class="clue-number">{ clue.clueNumber }.</th>
      <td><input class="clue" name={ clue.clueNumber + ClueDirection[clue.direction] } /></td>
      <td>(<input class="clue-letters" name={ clue.clueNumber + ClueDirection[clue.direction] +"letters" } />)</td>
    </tr>);
}

function showClues(puzzle: Puzzle, direction: ClueDirection, l10n: any) {
  return puzzle.clues
        .filter(clue => clue.direction == direction)
        .map(clue => showClue(clue, l10n));
}

export = (language: string, puzzle: Puzzle, l10n: any, template: string) => base(
  'create.js',
  l10n,
  <form method="post" action="/created" id="crosswordInput" class="ui-dialog">
    <div class="ui-dialog-titlebar">
      Enter clues for each item below. You may optionally specify comma-separated word lengths for multiple-word clues.
    </div>
    <table class="clue-input-table">
      <tr><th colspan="3" class="clue-direction">{ l10n.across }</th></tr>
      { showClues(puzzle, ClueDirection.across, l10n) }
      <tr><th colspan="3" class="clue-direction">{ l10n.down }</th></tr>
      { showClues(puzzle, ClueDirection.down, l10n) }
    </table>
    <input type="hidden" name="template" value={ template } />
    <input type="hidden" name="language" value={ language } />
    <div class="ui-dialog-buttonset">
      <input type="submit" class="ui-button" />
    </div>
  </form>,
  <div id="rendered" />
);
