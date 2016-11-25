export enum cellType {
  black,
  empty,
  outside,
}

export enum clue_direction {
  across,
  down,
}

export class clue {
  number : number;
  direction : clue_direction;
  initial_position : position;
  clue : string;

  constructor(number : number, direction : clue_direction, row : number, col : number) {
    this.number = number;
    this.direction = direction;
    this.initial_position = new position(row, col);
  }
}

export class position {
  row : number;
  col : number;

  constructor(row : number, col : number) { 
    this.row = row; 
    this.col = col; 
  } 
}

export class cell {
  solution : string = "";
  type : cellType;
  number : number;
  clues : { number : number; direction : clue_direction }[] = [];
  position : position;
  word_boundary_across : boolean;
  word_boundary_down : boolean;

  constructor(row : number, col : number) { 
    this.position = new position(row, col);
  }
  isFillable() { return this.type == cellType.empty; }
}

export class message {
  position : position;
  solution : string;
}

export class puzzle {
  language : string;
  cells : cell[][] = [];
  clues : clue[];
}
