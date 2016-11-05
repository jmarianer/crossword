const express = require('express');
const expressNunjucks = require('express-nunjucks');
const expressLess = require('express-less');

const app = express();
app.set('views', __dirname + '/templates');
app.use(express.static('public'));
app.use('/style', expressLess(__dirname + '/less'));
expressNunjucks(app, {
    watch: true,
    noCache: true
});

puzzle = [
  '..xxxxxxxxxx',
  'x.x.x.x.x.x',
  'xxxxxxx.xxxxx',
  'x.x.x.x.x.x.x',
  'xxxx.xxxxxxxx',
];

rows = puzzle.length + 2;
cols = Math.max(...puzzle.map(f=>f.length));
puzzle.unshift('!'.repeat(cols));
puzzle.push('!'.repeat(cols));
for (i = 0; i < rows; i++) {
  puzzle[i] = ('!' + puzzle[i] + '!'.repeat(cols - puzzle[i].length + 1)).split("");
}
cols += 2;

for (;;) {
  changed = false;
  for (i = 1; i < rows - 1; i++) {
    for (j = 1; j < cols - 1; j++) {
      if (puzzle[i][j] == '.') {
        if (puzzle[i][j-1] == '!' ||
            puzzle[i][j+1] == '!' ||
            puzzle[i-1][j] == '!' ||
            puzzle[i+1][j] == '!') {
          puzzle[i][j] = '!';
          changed = true;
        }
      }
    }
  }
  if (!changed) { 
    break;
  }
}

template = JSON.parse(JSON.stringify(puzzle));
number = 1;
for (i = 1; i < rows - 1; i++) {
  for (j = 1; j < cols - 1; j++) {
    if ('.!'.indexOf(puzzle[i][j]) == -1) {
      if (('.!'.indexOf(puzzle[i][j-1]) != -1 &&
           '.!'.indexOf(puzzle[i][j+1]) == -1) ||
          ('.!'.indexOf(puzzle[i-1][j]) != -1 &&
           '.!'.indexOf(puzzle[i+1][j]) == -1)) {
        template[i][j] = number++;
      } else {
        template[i][j] = ' ';
      }
    }
  }
}

app.get("/", function (request, response) {
  response.render('index', {
    puzzle: template,
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

