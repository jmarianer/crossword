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
  let ltr = $('.crossword').css('direction') === 'ltr';

  $('.number').each((_, n) => {
    let num = $(n);
    let block = num.parent();
    let pos = block.offset();

    pos.top += 2;
    if (ltr) {
      pos.left += 2;
    } else {
      pos.left += block.outerWidth() - num.outerWidth() - 2;
    }
    num.offset(pos);
  });

  $('.empty').click((e) => {
    activate($(e.currentTarget));
  });

  $('.Clue').click((e) => {
    currentDirection = <ClueDirection> <any> ClueDirection[$(e.currentTarget).data().direction];
    moveTo(getElementPosition($(e.currentTarget)));
  });

  $('body').keydown((e) => {
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
      move(position, 0, ltr ? -1 : 1);
    } else if (key === 'ArrowRight') {
      move(position, 0, ltr ? 1 : -1);
    } else if (key === 'ArrowUp') {
      move(position, -1, 0);
    } else if (key === 'ArrowDown') {
      move(position, 1, 0);
    } else if (key === 'Backspace') {
      sendSolution(position, ' ');
      if (currentDirection === ClueDirection.across) {
        move(position, 0, -1);
      } else {
        move(position, -1, 0);
      }
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

  updateStrikethroughs();
});

function updateStrikethroughs() {
  $('.clues .clue').each((_, clue) => {
    let clueName = $(clue).attr('class').split(/\s+/)
      .filter((i) => (i.match(/\d+(across|down)$/)))[0];
    let solution = $('.crossword .' + clueName).map((__, box) => $(box).find('.solution').text()).get();
    let emptyBoxes = solution.filter((i) => !(<string> <any> i).trim());
    if (emptyBoxes.length) {
      $(clue).removeClass('clue-done');
    } else {
      $(clue).addClass('clue-done');
    }
  });
}

socket.on('solution', (msg: Message) => {
  findCell(msg.position).find('.solution').html(msg.solution);
  updateStrikethroughs();
});
