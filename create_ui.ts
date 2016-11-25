import * as $ from 'jquery';
import { createPuzzle } from './create-puzzle';
import { cellType, clue_direction } from './types'

let table_template = require('./templates/crossword-table.nunj');
let clues_template = require('./templates/clues.nunj');

$(function() {
  $('form *').on('change keyup paste', function() {
    let values : {[id : string] : string} = {};
    $.each($('form').serializeArray(), (_, val) => {
      values[val.name] = val.value;
    });
    let puzzle = createPuzzle(values);
    $('#rendered').html(table_template({
      puzzle: puzzle,
      cellType: cellType,
      clue_direction: clue_direction,
    }));
  });
});
