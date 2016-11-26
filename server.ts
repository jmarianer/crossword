/// <reference types="node" />

import { cell, cellType, clue_direction, message, puzzle } from './types'
import { createPuzzle } from './create-puzzle'
import { MongoClient, ObjectID } from 'mongodb'
import { l10n } from './l10n'
import * as express from 'express';
import * as tss from 'typescript-simple';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as io from 'socket.io';
import * as nunjucks from 'nunjucks'; 
import * as browserify from 'browserify';
import * as bodyParser from 'body-parser';
import * as less from 'less';
//XXX figure out why these can't be imported
const tsify = require('tsify');
const nunjucksify = require('nunjucksify');
const concat = require('concat-stream');

function serve_js(app: express.Express, url: string, ts_filename: string) {
  let errors = false;
  console.log('Compiling ' + ts_filename);
  browserify(ts_filename)
    .plugin(tsify, { noImplicitAny: true })
    .transform(nunjucksify, { })
    .bundle()
    .on('error', (error: Error) => {
      console.error(error.toString());
      errors = true;
    })
    .pipe(concat((buf: Buffer) => {
      if (errors)
        throw 'Error compiling ' + ts_filename;
      console.log('Finished compiling ' + ts_filename);
      app.use(url, (req, res, next) => {
        res.set('Content-Type', 'text/javascript');
        res.send(buf.toString());
      });
    }));
}

const app = express();
app.set('views', __dirname + '/templates');
serve_js(app, '/js/crossword.js', 'main_ui.ts');
serve_js(app, '/js/create.js', 'create_ui.ts');
app.use(bodyParser.urlencoded({ extended: true }));
fs.readFile('style.less', (err : any, data : Buffer) => {
  if (err) throw err;
  less.render(data.toString(), (err : any, data : Less.RenderOutput) => {
    if (err) throw err;
    app.use('/style/style.css', function(req, res, next) {
      res.set('Content-Type', 'text/css');
      res.send(data.css);
    });
  });
});

nunjucks.configure('templates', { 
    autoescape: true, 
    express: app, 
});

MongoClient.connect(process.env.MONGODB, function(err, db) {
  if (err) throw err;

  db.collection('crosswords').find().toArray(function(err, data) {
    if (err) throw err;

    let puzzles : {[id: string]: puzzle} = {};
    for (let i of data) {
      puzzles[i._id] = i.puzzle;
    }

    app.get("/puzzle/:id", function (request, response) {
      let puzzid = request.params['id'];
      response.render('puzzle.nunj', {
        puzzle: puzzles[puzzid],
        cellType: cellType,
        clue_direction: clue_direction,
        l10n: l10n[puzzles[puzzid].language],
      });
    });
    
    app.get("/create/:language", function (request, response) {
      let language = request.params.language;
      response.render('create.nunj', {
        l10n: l10n[language],
        language: language,
      });
    });

    app.post("/getClues", function (request, response) {
      let newPuzzle = createPuzzle(request.body);
      let language = request.body.language;
      response.render('clues.nunj', {
        puzzle: newPuzzle,
        l10n: l10n[language],
        language: language,
        clue_direction: clue_direction,
        template: request.body.template,
      });
    });
    
    app.post('/created', function (request, response) {
      let newPuzzle = createPuzzle(request.body);
      
      db.collection('crosswords').insert({
        puzzle: newPuzzle,
      }, function(err, result) {
        if (err) throw err;
        
        let id = result.ops[0]._id;
        puzzles[id] = newPuzzle;
        response.redirect('/puzzle/' + id);
      });
    });

    let listener = app.listen(process.env.PORT, function () {
      console.log('Your app is up');
    });
    
    let io_listener = io(listener)
    io_listener.on('connection', function(socket) {
      let puzzid = path.basename(socket.client.request.headers.referer);
      socket.on('solution', function(msg : message) {
        msg.solution = msg.solution.toUpperCase();
        if (msg.solution.match(/[םןףץך]/)) {
          msg.solution = String.fromCharCode(msg.solution.charCodeAt(0) + 1);
        }
        puzzles[puzzid].cells[msg.position.row][msg.position.col].solution = msg.solution;
        db.collection('crosswords').update({_id: new ObjectID(puzzid)}, {$set: {puzzle: puzzles[puzzid]}})
        io_listener.emit('solution', msg);
      });
    });
  });
});
