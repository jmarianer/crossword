import * as $ from 'jquery';
import * as io from 'socket.io-client';
import { ClueDirection, Message, Position } from './types';

let socket = io();
let currentDirection = ClueDirection.across;

function getElementPosition(elt: JQuery) {
  let data = elt.data();
  return new Position(data.row, data.col);
}

function activate(elt: JQuery) {
  $('*').removeClass('active active-word passive-word');
  elt.addClass('active');

  let classes = elt.attr('class').split(/\s+/);
  if (currentDirection === ClueDirection.across) {
    classes
      .filter((i) => (i.match(/\d+across$/)))
      .forEach((i) => $('.' + i).addClass('active-word'));
    classes
      .filter((i) => (i.match(/\d+down$/)))
      .forEach((i) => $('.' + i).addClass('passive-word'));
  } else {
    classes
      .filter((i) => (i.match(/\d+down$/)))
      .forEach((i) => $('.' + i).addClass('active-word'));
    classes
      .filter((i) => (i.match(/\d+across/)))
      .forEach((i) => $('.' + i).addClass('passive-word'));
  }
}

function findCell(position: Position) {
  return $('.crossword td[data-row="' + position.row + '"][data-col="' + position.col + '"]');
}

function moveTo(position: Position) {
  let elt = findCell(position);
  if (elt.length) {
    activate(elt);
  }
}

function move(position: Position, drow: number, dcol: number) {
  for (; ; ) {
    position.row += drow;
    position.col += dcol;
    let elt = findCell(position);
    if (elt.length) {
      activate(elt);
      return;
    }

    let maxRow = $('.crossword').data('max-row');
    let maxCol = $('.crossword').data('max-col');
    if (position.row < 0 || position.row > maxRow || position.col < 0 || position.col > maxCol) {
      return;
    }
  }
}

function sendSolution(position: Position, solution: string) {
  if (position != null) {
    let msg: Message = { position, solution };
    socket.emit('solution', msg);
  }
}

$(() => {
  $('.empty').click((e) => {
    activate($(e.currentTarget));
  });

  $('.Clue').click((e) => {
    currentDirection = <ClueDirection> <any> ClueDirection[$(e.currentTarget).data().direction];
    moveTo(getElementPosition($(e.currentTarget)));
  });

  $('body').keydown((e) => {
    let direction = $('.crossword').css('direction') === 'ltr' ? 1 : -1;

    let key = e.key;
    let position = getElementPosition($('.active'));
    if (key.length === 1) {
      sendSolution(position, e.key);
      if (currentDirection === ClueDirection.across) {
        move(position, 0, 1);
      } else {
        move(position, 1, 0);
      }
    } else if (key === 'ArrowLeft') {
      move(position, 0, -direction);
    } else if (key === 'ArrowRight') {
      move(position, 0, direction);
    } else if (key === 'ArrowUp') {
      move(position, -1, 0);
    } else if (key === 'ArrowDown') {
      move(position, 1, 0);
    } else if (key === 'Backspace') {
      sendSolution(position, ' ');
    } else if (key === 'Enter') {
      if (currentDirection === ClueDirection.across) {
        currentDirection = ClueDirection.down;
      } else {
        currentDirection = ClueDirection.across;
      }
      moveTo(position);
    }
  });

  move(new Position(1, 0), 0, 1);
});

socket.on('solution', (msg: Message) => {
  findCell(msg.position).find('.solution').html(msg.solution);
});
