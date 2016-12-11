import * as $ from 'jquery';
import { createPuzzle } from './create-puzzle';
import { CellType, ClueDirection } from './types';

// tslint:disable-next-line:no-var-requires
let tableTemplate = require('./templates/crossword-table.nunj');

function getPuzzle() {
  let values: {[id: string]: string} = {};
  $.each($('#crosswordInput').serializeArray(), (_, val) => {
    values[val.name] = val.value;
  });
  return createPuzzle(values);
}

function renderPuzzle() {
  $('#rendered').html(tableTemplate({
    CellType,
    ClueDirection,
    puzzle: getPuzzle(),
  }));
}

$(() => {
  $('#crosswordInput *').on('change keyup paste', renderPuzzle);
  renderPuzzle();
});
