import { cell, cellType, clue, clue_direction, puzzle, position, puzzle_direction } from './types'
import { MongoClient } from 'mongodb'

export function createPuzzle(template_str : string) {
  let template = template_str.split("\n").map(s => s.replace(/(\r\n|\n|\r)/gm, ""));
  
  const rows = template.length + 2;
  const cols = Math.max(...template.map(f=>f.length)) + 2;
  
  let puzzle : puzzle = {
    direction: puzzle_direction.ltr,
    cells: [],
    clues: [],
  };
  
  for (let i = 0; i < rows; i++) {
    let row : cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(new cell(i, j));
    }
    puzzle.cells.push(row);
  }
  
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      let cell = puzzle.cells[i][j];
      let s = template[i-1][j-1];
      if (s == '.' || s == undefined) {
        cell.type = cellType.black;
      } else {
        cell.type = cellType.empty;
      }
    }
  }
  for (let i = 0; i < rows; i++) {
    puzzle.cells[i][0].type = cellType.outside;
    puzzle.cells[i][cols-1].type = cellType.outside;
  }
  for (let j = 0; j < cols; j++) {
    puzzle.cells[0][j].type = cellType.outside;
    puzzle.cells[rows-1][j].type = cellType.outside;
  }
  
  for (;;) {
    let changed = false;
    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        if (puzzle.cells[i][j].type == cellType.black && (
            puzzle.cells[i][j-1].type == cellType.outside ||
            puzzle.cells[i][j+1].type == cellType.outside ||
            puzzle.cells[i-1][j].type == cellType.outside ||
            puzzle.cells[i+1][j].type == cellType.outside)) {
            puzzle.cells[i][j].type = cellType.outside;
          changed = true;
        }
      }
    }
    if (!changed) { 
      break;
    }
  }
  
  let number = 1;
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      if (!puzzle.cells[i][j].isFillable()) {
       continue;
      }

      let across = false, down = false;
      if (!puzzle.cells[i][j-1].isFillable() && puzzle.cells[i][j+1].isFillable()) {
        across = true;
      }
      if (!puzzle.cells[i-1][j].isFillable() && puzzle.cells[i+1][j].isFillable()) {
        down = true;
      }

      if (across) {
        puzzle.clues.push(new clue(number, clue_direction.across, i, j));
      }
      if (down) {
        puzzle.clues.push(new clue(number, clue_direction.down, i, j));
      }
      if (across || down) {
        puzzle.cells[i][j].number = number++;
      }
    }
  }

  for (let clue of puzzle.clues) {
    let current_position = new position(clue.initial_position.row, clue.initial_position.col);
    while (puzzle.cells[current_position.row][current_position.col].isFillable()) {
      puzzle.cells[current_position.row][current_position.col].clues.push(
        {number: clue.number, direction: clue.direction});
      if (clue.direction == clue_direction.across) {
        current_position.col++;
      }
      else {
        current_position.row++;
      }
    }
  }
  
  return puzzle;
}
