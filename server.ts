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
import * as expressLess from 'express-less';
import * as io from 'socket.io';
import * as nunjucks from 'nunjucks'; 
import * as browserify from 'browserify';
import * as bodyParser from 'body-parser';
//XXX figure out why this can't be imported
const tsify = require('tsify');

const app = express();
app.set('views', __dirname + '/templates');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/style', expressLess(__dirname + '/less'));
browserify('ui.ts')
  .plugin(tsify, { noImplicitAny: true })
  .bundle(function(err : any, buf : Buffer) {
    if (err) {
      console.log(err);
    }
    let js = buf.toString();
    app.use('/js/crossword.js', function(req, res, next) {
      res.set('Content-Type', 'text/javascript');
      res.send(buf.toString());
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

    app.get("/puzzle/*", function (request, response) {
      let puzzid = path.basename(request.url);
      response.render('puzzle.html', {
        puzzle: puzzles[puzzid],
        cellType: cellType,
        clue_direction: clue_direction,
        l10n: l10n[puzzles[puzzid].language],
      });
    });
    
    app.get("/create", function (request, response) {
      response.render('create.html');
    });
    
    app.post('/created', function (request, response) {
      let newPuzzle = createPuzzle(request.body.template);
      
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
