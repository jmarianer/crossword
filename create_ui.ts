import * as $ from 'jquery';
import { createPuzzle } from './create-puzzle';
import { cellType, clue_direction } from './types'
let table_template = require('./templates/crossword-table.nunj');

$(function() {
  $('[name=template]').on('change keyup paste', function() {
    let template = $(this).val();
    let puzzle = createPuzzle(template, '');
    $('#rendered').html(table_template({
      puzzle: puzzle,
      cellType: cellType,
      clue_direction: clue_direction,
    }));
  });
});
