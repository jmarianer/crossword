import * as $ from 'jquery';
import { createPuzzle } from './create-puzzle';
import { cellType, clue_direction } from './types'

let table_template = require('./templates/crossword-table.nunj');
let clues_template = require('./templates/clues.nunj');

function getPuzzle() {
  let values : {[id : string] : string} = {};
  $.each($('#crosswordInput').serializeArray(), (_, val) => {
    values[val.name] = val.value;
  });
  return createPuzzle(values);
}

function renderPuzzle() {
  $('#rendered').html(table_template({
    puzzle: getPuzzle(),
    cellType: cellType,
    clue_direction: clue_direction,
  }));
}

$(function() {
  $('#crosswordInput *').on('change keyup paste', renderPuzzle);
  renderPuzzle();
});
