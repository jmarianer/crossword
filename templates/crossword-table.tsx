import { Cell, CellType, Clue, ClueDirection, Puzzle } from '../types';
import * as React from './noreact';

function cellToTd(cell: Cell) {
  if (cell.type === CellType.black) {
    return <td class='black' />;
  }
  if (cell.type === CellType.outside) {
    return <td class='outside' />;
  }

  let classList = ['empty'];
  classList.push(...cell.clues.map((clue) => clue.clueNumber + ClueDirection[clue.direction]));
  if (cell.wordBoundaryAcross) {
    classList.push('word-boundary-across');
  }
  if (cell.wordBoundaryDown) {
    classList.push('word-boundary-down');
  }
  return (
    <td class={ classList.join(' ') } data-row={ cell.position.row } data-col={ cell.position.col }>
      { cell.clueNumber === undefined ? '' : <div class='number'>{ cell.clueNumber }</div> }
      <span class='solution'>{ cell.solution }</span>
    </td>
  );
}

export = (id: string, puzzle: Puzzle) =>
  <table class='crossword' data-id={ id } data-max-row={ puzzle.cells.length } data-max-col={ puzzle.cells[0].length }>
    { puzzle.cells.map((row) =>
      <tr>
        { row.map(cellToTd) }
      </tr>,
    )}
  </table>;
