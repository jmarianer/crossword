/// <reference types="node" />

import { cell, cellType } from './types'
import { MongoClient } from 'mongodb'
import * as express from 'express';
import * as tss from 'typescript-simple';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as expressLess from 'express-less';
import * as io from 'socket.io';
const expressNunjucks = require('express-nunjucks');

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


MongoClient.connect(process.env.MONGODB, function(err, db) {
  if (err) throw err;

  db.collection('crosswords').find({id: 1}).toArray(function(err, data) {
    if (err) throw err;

    let puzzle = data[0].puzzle;

    app.get("/", function (request, response) {
      response.render('index', {
        puzzle: puzzle,
        cellType: cellType,
      });
    });
    
    var listener = app.listen(process.env.PORT, function () {
      console.log('Your app is listening on port ' + listener.address().port);
    });
    
    var io_listener = io(listener)
    io_listener.on('connection', function(socket){
      console.log('a user connected');
      socket.on('solution', function(msg) {
        puzzle[msg.row][msg.col].user_solution = msg.solution;
        db.collection('crosswords').update({id: 1}, {$set: {puzzle: puzzle}})
        io_listener.emit('solution', msg);
      });
    });
  });
});
