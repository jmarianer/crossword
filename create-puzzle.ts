import { MongoClient } from 'mongodb';
import { Cell, CellType, Clue, ClueDirection, Position, Puzzle } from './types';

export function createPuzzle(args: any) {
  let templateStr: string = args.template;
  let language: string = args.language;
  let template = templateStr.split('\n').map((s) => s.replace(/(\r\n|\n|\r)/gm, ''));

  const rows = template.length + 2;
  const cols = Math.max(...template.map((f) => f.length)) + 2;

  let puzzle: Puzzle = {
    cells: [],
    clues: [],
    language,
  };

  for (let i = 0; i < rows; i++) {
    let row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(new Cell(i, j));
    }
    puzzle.cells.push(row);
  }

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      let Cell = puzzle.cells[i][j];
      let s = template[i - 1][j - 1];
      if (s === '.' || s === undefined) {
        Cell.type = CellType.black;
      } else {
        Cell.type = CellType.empty;
      }
    }
  }
  for (let i = 0; i < rows; i++) {
    puzzle.cells[i][0].type = CellType.outside;
    puzzle.cells[i][cols - 1].type = CellType.outside;
  }
  for (let j = 0; j < cols; j++) {
    puzzle.cells[0][j].type = CellType.outside;
    puzzle.cells[rows - 1][j].type = CellType.outside;
  }

  for (; ; ) {
    let changed = false;
    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        if (puzzle.cells[i][j].type === CellType.black && (
            puzzle.cells[i][j - 1].type === CellType.outside ||
            puzzle.cells[i][j + 1].type === CellType.outside ||
            puzzle.cells[i - 1][j].type === CellType.outside ||
            puzzle.cells[i + 1][j].type === CellType.outside)) {
            puzzle.cells[i][j].type = CellType.outside;
            changed = true;
        }
      }
    }
    if (!changed) {
      break;
    }
  }

  let clueNumber = 1;
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      if (!puzzle.cells[i][j].isFillable()) {
       continue;
      }

      let across = false;
      let down = false;
      if (!puzzle.cells[i][j - 1].isFillable() && puzzle.cells[i][j + 1].isFillable()) {
        across = true;
      }
      if (!puzzle.cells[i - 1][j].isFillable() && puzzle.cells[i + 1][j].isFillable()) {
        down = true;
      }

      if (across) {
        puzzle.clues.push(new Clue(clueNumber, ClueDirection.across, i, j));
      }
      if (down) {
        puzzle.clues.push(new Clue(clueNumber, ClueDirection.down, i, j));
      }
      if (across || down) {
        puzzle.cells[i][j].clueNumber = clueNumber++;
      }
    }
  }

  for (let clue of puzzle.clues) {
    let clueArg = clue.clueNumber + ClueDirection[clue.direction];
    clue.clue = args[clueArg];

    let wordLengthsStr: string = args[clueArg + 'letters'];
    let wordLengths: number[] = [];
    if (wordLengthsStr) {
      wordLengths = wordLengthsStr.split(',').map((s, _) => parseInt(s, 10));
    }

    let currentPosition = new Position(clue.initialPosition.row, clue.initialPosition.col);
    while (puzzle.cells[currentPosition.row][currentPosition.col].isFillable()) {
      puzzle.cells[currentPosition.row][currentPosition.col].clues.push({
        clueNumber: clue.clueNumber,
        direction: clue.direction,
      });

      if (--wordLengths[0] === 0 && wordLengths.length > 1) {
        if (clue.direction === ClueDirection.across) {
          puzzle.cells[currentPosition.row][currentPosition.col].wordBoundaryAcross = true;
        } else {
          puzzle.cells[currentPosition.row][currentPosition.col].wordBoundaryDown = true;
        }
        wordLengths.shift();
      }

      if (clue.direction === ClueDirection.across) {
        currentPosition.col++;
      } else {
        currentPosition.row++;
      }
    }
  }

  return puzzle;
}
