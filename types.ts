export enum cellType {
  black,
  empty,
  outside,
}

export class cell {
  solution : string;
  type : cellType;
  number : number;
  user_solution : string = "";
  row : number;
  col : number;
  
  isFillable() { return this.type == cellType.empty; }
}
