import { cell, cellType, clue, clue_direction, puzzle, position, puzzle_direction } from './types'
import { MongoClient } from 'mongodb'

export function createPuzzle(template_str : string) {
  let template = template_str.split("\n").map(s => s.replace(/(\r\n|\n|\r)/gm, ""));
  console.log(template);
  
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
      if (puzzle[i][j].isFillable() && (
          ((!puzzle[i][j-1].isFillable()) &&
           (puzzle[i][j+1].isFillable())) ||
          ((!puzzle[i-1][j].isFillable()) &&
           (puzzle[i+1][j].isFillable())))) {
        puzzle[i][j].number = number++;
      }
    }
  }
  
  return puzzle;
}
