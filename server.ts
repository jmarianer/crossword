// tslint:disable:no-console no-shadowed-variable
/// <reference types="node" />

import { createPuzzle } from './create-puzzle';
import { l10n } from './l10n';
import { Cell, CellType, ClueDirection, Message, Puzzle } from './types';

import * as bodyParser from 'body-parser';
import * as browserify from 'browserify';
import * as express from 'express';
import * as fs from 'fs';
import * as less from 'less';
import { Db, MongoClient, ObjectID } from 'mongodb';
import * as path from 'path';
import * as io from 'socket.io';
import * as tss from 'typescript-simple';
import * as url from 'url';

import puzzleTemplate = require('./templates/puzzle');
import createTemplate = require('./templates/create');
import shareTemplate = require('./templates/share');
import cluesTemplate = require('./templates/clues');

// tslint:disable:no-var-requires TODO figure out why these can't be imported
const concat = require('concat-stream');

function serveJs(app: express.Express, url: string, tsFilename: string) {
  let errors = false;
  console.log('Compiling ' + tsFilename);
  browserify(tsFilename)
    .plugin('tsify', { noImplicitAny: true, jsx: 'react' })
    .bundle()
    .on('error', (error: Error) => {
      console.error(error.toString());
      errors = true;
    })
    .pipe(concat((buf: Buffer) => {
      if (errors) {
        throw 'Error compiling ' + tsFilename;
      }
      console.log('Finished compiling ' + tsFilename);
      app.use(url, (req, res, next) => {
        res.set('Content-Type', 'text/javascript');
        res.send(buf.toString());
      });
    }));
}

const app = express();
app.set('views', __dirname + '/templates');
serveJs(app, '/js/crossword.js', 'main_ui.ts');
serveJs(app, '/js/create.js', 'create_ui.ts');
serveJs(app, '/js/share.js', 'share_ui.ts');
app.use(bodyParser.urlencoded({ extended: true }));
fs.readFile('style.less', (err: any, data: Buffer) => {
  if (err) {
    throw err;
  }
  less.render(data.toString(), (err: any, data: Less.RenderOutput) => {
    if (err) {
      throw err;
    }
    app.use('/style/style.css', (req, res, next) => {
      res.set('Content-Type', 'text/css');
      res.send(data.css);
    });
  });
});

let puzzles: {[id: string]: Puzzle} = {};

function fork(puzzle: Puzzle): Puzzle {
  return JSON.parse(JSON.stringify(puzzle));
}
function clone(puzzle: Puzzle): Puzzle {
  let newPuzzle = fork(puzzle);
  for (let row of newPuzzle.cells) {
    for (let cell of row) {
      cell.solution = '';
    }
  }
  return newPuzzle;
}

function addPuzzle(db: Db, puzzle: Puzzle, callback: (id: ObjectID) => void) {
  db.collection('crosswords').insert({ puzzle }, (err, result) => {
    if (err) {
      throw err;
    }

    let id = result.ops[0]._id;
    puzzles[id] = puzzle;
    callback(id);
  });
}

MongoClient.connect(process.env.MONGODB, (err, db) => {
  if (err) {
    throw err;
  }

  db.collection('crosswords').find().toArray((err, data) => {
    if (err) {
      throw err;
    }

    for (let i of data) {
      puzzles[i._id] = i.puzzle;
    }

    app.get('/puzzle/:id', (request, response) => {
      let puzzid = request.params.id;
      response.send(puzzleTemplate(puzzid, puzzles[puzzid], l10n[puzzles[puzzid].language]));
    });

    app.get('/share/:id', (request, response) => {
      let puzzid = request.params.id;
      response.send(shareTemplate(puzzid, puzzles[puzzid], l10n[puzzles[puzzid].language]));
    });

    app.get('/create/:language', (request, response) => {
      let language = request.params.language;
      response.send(createTemplate(language, l10n[language]));
    });

    app.post('/getClues', (request, response) => {
      let newPuzzle = createPuzzle(request.body);
      let language = request.body.language;
      response.send(cluesTemplate(language, newPuzzle, l10n[language], request.body.template));
    });

    app.post('/created', (request, response) => {
      let newPuzzle = createPuzzle(request.body);
      addPuzzle(db, newPuzzle, (id) => response.redirect('/puzzle/' + id));
    });

    app.get('/fork/:id', (request, response) => {
      addPuzzle(db, fork(puzzles[request.params.id]), (id) => response.send(id));
    });

    app.get('/clone/:id', (request, response) => {
      addPuzzle(db, clone(puzzles[request.params.id]), (id) => response.send(id));
    });

    let listener = app.listen(process.env.PORT, () => {
      console.log('Your app is up');
    });

    let ioListener = io(listener);
    ioListener.on('connection', (socket) => {
      let puzzid = path.basename(socket.client.request.headers.referer);
      socket.join(puzzid);
      socket.on('solution', (msg: Message) => {
        msg.solution = msg.solution.toUpperCase();
        if (msg.solution.match(/[םןףץך]/)) {
          msg.solution = String.fromCharCode(msg.solution.charCodeAt(0) + 1);
        }
        puzzles[puzzid].cells[msg.position.row][msg.position.col].solution = msg.solution;
        db.collection('crosswords').update({_id: new ObjectID(puzzid)}, {$set: {puzzle: puzzles[puzzid]}});
        ioListener.to(puzzid).emit('solution', msg);
      });
    });
  });
});
