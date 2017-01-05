import * as $ from 'jquery';
import { createPuzzle } from './create-puzzle';
import { CellType, ClueDirection } from './types';
import tableTemplate = require('./templates/crossword-table');

function getPuzzle() {
  let values: {[id: string]: string} = {};
  $.each($('#crosswordInput').serializeArray(), (_, val) => {
    values[val.name] = val.value;
  });
  return createPuzzle(values);
}

function renderPuzzle() {
  $('#rendered').html(tableTemplate('', getPuzzle()).toString());
}

$(() => {
  $('#crosswordInput *').on('change keyup paste', renderPuzzle);
  renderPuzzle();
});
