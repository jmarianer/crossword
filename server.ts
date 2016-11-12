/// <reference types="node" />

import { cell, cellType } from './types'
import { createPuzzle } from './create-puzzle'
import { MongoClient } from 'mongodb'
import * as express from 'express';
import * as tss from 'typescript-simple';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as expressLess from 'express-less';
import * as io from 'socket.io';
//XXX figure out why these can't be imported
//import * as bodyParser from 'body-parser';
const bodyParser = require('body-parser');
const expressNunjucks = require('express-nunjucks');
const browserify = require('browserify');
const tsify = require('tsify');

const app = express();
app.set('views', __dirname + '/templates');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/style', expressLess(__dirname + '/less'));
browserify('ui.ts')
  .plugin(tsify) // XXX , { noImplicitAny: true })
  .bundle(function(err, buf) {
    if (err) {
      console.log(err);
    }
    var js = buf.toString();
    app.use('/js/crossword.js', function(req, res, next) {
      res.set('Content-Type', 'text/javascript');
      res.send(buf.toString());
    });
  });

expressNunjucks(app, {
    watch: true,
    noCache: true,
});

MongoClient.connect(process.env.MONGODB, function(err, db) {
  if (err) throw err;

  db.collection('crosswords').find().toArray(function(err, data) {
    if (err) throw err;

    let puzzles : {[id: number]: cell[][]} = {};
    for (let i of data) {
      puzzles[i._id] = i.puzzle;
    }

    app.get("/puzzle/*", function (request, response) {
      var puzzid = path.basename(request.url);
      response.render('puzzle', {
        puzzle: puzzles[puzzid],
        cellType: cellType,
      });
    });
    
    app.get("/create", function (request, response) {
      response.render('create');
    });
    
    app.post('/created', function (request, response) {
      var newPuzzle = createPuzzle(request.body.template);
      
      db.collection('crosswords').insert({
        puzzle: newPuzzle,
      }, function(err, result) {
        if (err) throw err;
        
        var id = result.ops[0]._id;
        puzzles[id] = newPuzzle;
        response.redirect('/puzzle/' + id);
      });
    });

    var listener = app.listen(process.env.PORT, function () {
      console.log('Your app is up');
    });
    
    var io_listener = io(listener)
    io_listener.on('connection', function(socket) {
      var puzzid = path.basename(socket.client.request.headers.referer);
      socket.on('solution', function(msg) {
        puzzles[puzzid][msg.row][msg.col].user_solution = msg.solution;
        db.collection('crosswords').update({id: puzzid}, {$set: {puzzle: puzzles[puzzid]}})
        io_listener.emit('solution', msg);
      });
    });
  });
});
