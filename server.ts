/// <reference types="node" />

import * as express from 'express';
import * as tss from 'typescript-simple';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
const expressNunjucks = require('express-nunjucks');
const expressLess = require('express-less');

const app = express();
app.set('views', __dirname + '/templates');
//app.use(express.static('public'));
app.use('/style', expressLess(__dirname + '/less'));
app.use('/js', function(req, res, next) {
  if (req.method != 'GET' && req.method != 'HEAD') {
      return next();
  }

  var pathname = url.parse(req.url).pathname;

  if (path.extname(pathname) != '.js') {
      return next();
  }

  var src = path.join(
      __dirname,
      'typescript',
      path.dirname(pathname),
      path.basename(pathname, '.js') + '.ts'
  );

  fs.readFile(src, function(err, data) {
    if (err) return next();

    res.set('Content-Type', 'text/javascript');
    res.send(tss(data.toString('utf8')));
  });
});
expressNunjucks(app, {
    watch: true,
    noCache: true,
});

const template = [
  '..xxxxxxxxxx',
  'x.x.x.x.x.x',
  'xxxxxxx.xxxxx',
  'x.x.x.x.x.x.x',
  'xxxx.xxxxxxxx',
];

const rows = template.length + 2;
const cols = Math.max(...template.map(f=>f.length)) + 2;

enum types {
  black,
  empty,
  outside,
}
class cell {
  type : types;
  number : number;
  user_solution : string = "";
  
  isFillable() { return this.type == types.empty; }
}
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
    var s = template[i-1][j-1];
    if (s == '.' || s == undefined) {
      puzzle[i][j].type = types.black;
    } else {
      puzzle[i][j].type = types.empty;
    }
  }
}
for (let i = 0; i < rows; i++) {
  puzzle[i][0].type = types.outside;
  puzzle[i][cols-1].type = types.outside;
}
for (let j = 0; j < cols; j++) {
  puzzle[0][j].type = types.outside;
  puzzle[rows-1][j].type = types.outside;
}

for (;;) {
  let changed = false;
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      if (puzzle[i][j].type == types.black && (
          puzzle[i][j-1].type == types.outside ||
          puzzle[i][j+1].type == types.outside ||
          puzzle[i-1][j].type == types.outside ||
          puzzle[i+1][j].type == types.outside)) {
          puzzle[i][j].type = types.outside;
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

app.get("/", function (request, response) {
  response.render('index', {
    puzzle: puzzle,
    types: types,
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
