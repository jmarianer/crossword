import * as $ from 'jquery';
import * as io from 'socket.io-client';
import { clue_direction, message, position } from './types';

let socket = io();
let current_direction = clue_direction.across;

function getElementPosition(elt: JQuery) {
  var data = elt.data();
  return new position(data.row, data.col);
}

function activate(elt : JQuery) {
  $('*').removeClass('active active-word passive-word');
  elt.addClass('active');

  let classes = elt.attr('class').split(/\s+/);
  if (current_direction == clue_direction.across) {
    classes
      .filter(i => (i.match(/across$/)))
      .forEach(i => $('.' + i).addClass('active-word'));
    classes
      .filter(i => (i.match(/down$/)))
      .forEach(i => $('.' + i).addClass('passive-word'));
  } else {
    classes
      .filter(i => (i.match(/down$/)))
      .forEach(i => $('.' + i).addClass('active-word'));
    classes
      .filter(i => (i.match(/across/)))
      .forEach(i => $('.' + i).addClass('passive-word'));
  }
}

function findCell(position : position) {
  return $('[data-row="' + position.row + '"][data-col="' + position.col + '"]');
}

function move(position : position, drow : number, dcol : number) {
  for (;;) {
    position.row += drow;
    position.col += dcol;
    var elt = findCell(position);
    if (elt.length) {
      activate(elt);
      return;
    }

    // TODO: these 100s are bogus.
    if (position.row < 0 || position.row > 100 || position.col < 0 || position.col > 100) {
      return;
    }
  }
}

function sendSolution(position : position, solution : string) {
  if (position != null) {
    var msg : message = {
      position: position,
      solution: solution,
    };
    socket.emit('solution', msg);
  }
}

$(function() {
  $('.empty').click(function() {
    activate($(this));
  });

  $('body').keydown(function(e) {
    var direction = $('.crossword').css('direction') == 'ltr' ? 1 : -1;
  
    var key = e.key;
    var position = getElementPosition($('.active'));
    if (key.length == 1) {
      sendSolution(position, e.key.toUpperCase());
      if (current_direction == clue_direction.across) {
        move(position, 0, 1);
      } else {
        move(position, 1, 0);
      }
    } else if (key == 'ArrowLeft') {
      move(position, 0, -direction);
    } else if (key == 'ArrowRight') {
      move(position, 0, direction);
    } else if (key == 'ArrowUp') {
      move(position, -1, 0);
    } else if (key == 'ArrowDown') {
      move(position, 1, 0);
    } else if (key == 'Backspace') {
      sendSolution(position, ' ');
    } else if (key == 'Enter') {
      if (current_direction == clue_direction.across) {
        current_direction = clue_direction.down;
      } else {
        current_direction = clue_direction.across;
      }
      move(position, 0, 0);
    }
  });
});

socket.on('solution', function (msg : message) {
  findCell(msg.position).find('.solution').html(msg.solution);
});
