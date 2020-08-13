// tslint:disable:no-console
import { createPuzzle } from './create-puzzle';
import { l10n } from './l10n';
import { Cell, CellType, ClueDirection, Message, Puzzle } from './types';

import * as async from 'async';
import * as bodyParser from 'body-parser';
import * as browserify from 'browserify';
import concat = require('concat-stream');
import * as express from 'express';
import * as fs from 'fs';
import * as less from 'less';
import { Db, MongoCallback, MongoClient, ObjectID } from 'mongodb';
import * as path from 'path';
import * as io from 'socket.io';
import * as url from 'url';

import puzzleTemplate = require('./templates/puzzle');
import createTemplate = require('./templates/create');
import shareTemplate = require('./templates/share');
import cluesTemplate = require('./templates/clues');

// Globals
let puzzles: {[id: string]: Puzzle} = {};
let db: Db;

function serveStatic(app: express.Express, url: string, filename: string) {
  app.get(url, (req, res) => {
    res.sendFile(path.resolve(__dirname, filename));
  });
}

// Helpers for creating and cloning puzzles.
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

function addPuzzle(puzzle: Puzzle, callback: (id: ObjectID) => void) {
  db.collection('crosswords').insert({ puzzle }, (err, result) => {
    if (err) {
      throw err;
    }

    let id = result.ops[0]._id;
    puzzles[id.toHexString()] = puzzle;
    callback(id);
  });
}

// Main begins here.
const app = express();
serveStatic(app, '/js/crossword.js', 'main_ui.js');
serveStatic(app, '/js/create.js', 'create_ui.js');
serveStatic(app, '/js/share.js', 'share_ui.js');
serveStatic(app, '/style/style.css', 'style.css');

MongoClient.connect(process.env.MONGODB, (err, client) => {
  if (err) {
    throw err;
  }

  app.use(bodyParser.urlencoded({ extended: true }));

  db = client.db('crosswords');
  db.collection('crosswords').find().toArray((_, db_puzzles) => {
    for (let i of db_puzzles) {
      puzzles[i._id] = i.puzzle;
    }
  });

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
    addPuzzle(newPuzzle, (id) => response.redirect('/puzzle/' + id));
  });

  app.get('/fork/:id', (request, response) => {
    addPuzzle(fork(puzzles[request.params.id]), (id) => response.send(id));
  });

  app.get('/clone/:id', (request, response) => {
    addPuzzle(clone(puzzles[request.params.id]), (id) => response.send(id));
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
