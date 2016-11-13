import * as $ from 'jquery';
import * as io from 'socket.io-client';
import { message, position } from './types';

let socket = io();

function getElementPosition(elt: JQuery) {
  var data = elt.data();
  return new position(data.row, data.col);
}

function activate(elt : JQuery) {
  $('*').removeClass('active active-word passive-word');
  elt.addClass('active');

  let classes = elt.attr('class').split(/\s+/);
  classes
    .filter(i => (i.match(/across$/)))
    .forEach(i => $('.' + i).addClass('active-word'));
  classes
    .filter(i => (i.match(/down/)))
    .forEach(i => $('.' + i).addClass('passive-word'));
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
    }
  });
});

socket.on('solution', function (msg : message) {
  findCell(msg.position).find('.solution').html(msg.solution);
});
