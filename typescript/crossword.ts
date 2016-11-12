/// <reference types="jquery" />
declare var $;

function activate(elt) {
  $('.active').removeClass('active');
  $(elt).addClass('active');
}

function find(row, col) {
  return $('[data-row="' + row + '"][data-col="' + col + '"]');
}

function move(row, col, drow, dcol) {
  for (;;) {
    row += drow;
    col += dcol;
    var elt = find(row, col);
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

function sendSolution(data, solution) {
  // Stub.
}

$(function() {
  $('.empty').click(function() {
    activate(this);
  });

  $('body').keydown(function(e) {
    var direction = $('.crossword').css('direction') == 'ltr' ? 1 : -1;
  
    var key = e.key;
    var data = $('.active').data();
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
