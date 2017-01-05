import * as React from './noreact';
import base = require('./base');
import crosswordTable = require('./crossword-table');
import { Clue, Puzzle, ClueDirection } from '../types';

export = (id: string, puzzle: Puzzle, l10n: any) => base(
  'share.js',
  l10n,
  <a href={ `/puzzle/${ id }` } class="hamburger"></a>,
  crosswordTable(id, puzzle),
  <div class="share">
    <h2>Share this puzzle</h2>
    <div>
      <div>
        <h3>Collaborate</h3>
        Everyone who uses this link will see what everyone else types.
        <div class="spacer"></div>
        <div class="show-link" id="collaborate-button">Show link</div>
      </div>
      <div>
        <h3>Fork</h3>
        Copy this puzzle with the solution in its current state.
        <div class="spacer"></div>
        <div class="show-link" id="fork-button">Show link</div>
      </div>
      <div>
        <h3>Clone new</h3>
        Copy this puzzle without its solution.
        <div class="spacer"></div>
        <div class="show-link" id="clone-button">Show link</div>
      </div>
    </div>
  </div>,
  <div id="dialog" class="dialog" title="Share this URL">
    <code id="share-url"></code>
  </div>
);
