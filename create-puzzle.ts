import { cell, cellType } from './types'
import { MongoClient } from 'mongodb'

export function createPuzzle(template_str : string) {
  let template = template_str.split("\n").map(s => s.replace(/(\r\n|\n|\r)/gm, ""));
  console.log(template);
  
  const rows = template.length + 2;
  const cols = Math.max(...template.map(f=>f.length)) + 2;
  
  var puzzle : cell[][];
  puzzle = [];
  
  for (let i = 0; i < rows; i++) {
    let row : cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(new cell());
    }
    puzzle.push(row);
  }
  
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      puzzle[i][j].row = i;
      puzzle[i][j].col = j;
      var s = template[i-1][j-1];
      if (s == '.' || s == undefined) {
        puzzle[i][j].type = cellType.black;
      } else {
        puzzle[i][j].solution = s;
        puzzle[i][j].type = cellType.empty;
      }
    }
  }
  for (let i = 0; i < rows; i++) {
    puzzle[i][0].type = cellType.outside;
    puzzle[i][cols-1].type = cellType.outside;
  }
  for (let j = 0; j < cols; j++) {
    puzzle[0][j].type = cellType.outside;
    puzzle[rows-1][j].type = cellType.outside;
  }
  
  for (;;) {
    let changed = false;
    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        if (puzzle[i][j].type == cellType.black && (
            puzzle[i][j-1].type == cellType.outside ||
            puzzle[i][j+1].type == cellType.outside ||
            puzzle[i-1][j].type == cellType.outside ||
            puzzle[i+1][j].type == cellType.outside)) {
            puzzle[i][j].type = cellType.outside;
          changed = true;
        }
      }
    }
    if (!changed) { 
      break;
    }
  }
  
  var number = 1;
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
