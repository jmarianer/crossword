import * as $ from 'jquery';
import * as io from 'socket.io-client';
import { message } from './types';
let socket = io();

function activate(elt : JQuery) {
  $('.active').removeClass('active');
  $(elt).addClass('active');
}

function find(row : number, col : number) {
  return $('[data-row="' + row + '"][data-col="' + col + '"]');
}

function move(row : number, col : number, drow : number, dcol : number) {
  for (;;) {
    row += drow;
    col += dcol;
    let elt = find(row, col);
    if (elt.length) {
      activate(elt);
      return;
    }
    // TODO: these 100s are bogus.
    if (row < 0 || row > 100 || col < 0 || col > 100) {
      return;
    }
  }
}

function sendSolution(data : any, solution : string) {  // XXX I don't think this should be "any"
  if (data != null) {
    let msg : message = {
      row: data.row,
      col: data.col,
      solution: solution,
    };
    socket.emit('solution', msg);
  }
}

$(function() {
  $('.empty').click(function() {
    activate(this);
  });

  $('body').keydown(function(e) {
    let direction = $('.crossword').css('direction') == 'ltr' ? 1 : -1;
  
    let key = e.key;
    let data = $('.active').data();
    if (key.length == 1) {
      sendSolution(data, e.key.toUpperCase());
    } else if (key == 'ArrowLeft') {
      move(data.row, data.col, 0, -direction);
    } else if (key == 'ArrowRight') {
      move(data.row, data.col, 0, direction);
    } else if (key == 'ArrowUp') {
      move(data.row, data.col, -1, 0);
    } else if (key == 'ArrowDown') {
      move(data.row, data.col, 1, 0);
    } else if (key == 'Backspace') {
      sendSolution(data, ' ');
    }
  });
});

socket.on('solution', function (msg : message) {
  find(msg.row, msg.col).find('.solution').html(msg.solution);
});
