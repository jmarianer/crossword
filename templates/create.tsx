import * as React from './noreact';
import base = require('./base');
import { Clue, ClueDirection, Puzzle } from '../types';

export = (language: string, l10n: any) => base(
  'create.js',
  l10n,
  <form method='post' action='/getClues' id='crosswordInput' class='ui-dialog'>
    <div class='ui-dialog-titlebar'>
      Enter the crossword template below, using 'x' for white squares and '.' for black squares.
    </div>
    <textarea name='template' rows='25' cols='40'></textarea>
    <input type='hidden' name='language' value={ language } />
    <div class='ui-dialog-buttonset'>
      <input type='submit' class='ui-button' />
    </div>
  </form>,
  <div id='rendered' />,
);
