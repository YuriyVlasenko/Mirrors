/*
 var http = require('http');

 http.createServer(function (req, res) {
 res.writeHead(200, {'Content-Type': 'text/plain'});
 res.end('Hello World\n');
 }).listen(8080);

 console.log('server running on port 8080');
 */


/*var express= require('express');
var path = require('path');

var winston = require('winston');

var app = express();
*/



var nConf = require('nconf');
var config = require('./libs/config');
var favicon = require('serve-favicon');
var path = require('path');
var fs = require('fs');
var http = require('http');
var url = require('url');
var log = require('./libs/log')(module);
var mongoose = require('./libs/mongoose');
var express = require('express');
var apiRoutes = require('./routes/api');
var app = express();

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Handle not existed images.
app.use(function (req, res, next) {
    var request = url.parse(req.url, true);
    var action = request.pathname;
    if (action.indexOf('images')==-1){
        next();
        return;
    }

    var localPath =  path.join(__dirname, 'public',action);
    fs.exists(localPath,function(exists){
        console.log(action);
        if(exists)
        {
            next();
        }
        else{
            fs.readFile(__dirname + '/public/images/noPhoto.png', function(err, buf){
                if (!err)
                {
                    res.send(buf);
                }
                res.end();
            });
        }
    });
});

app.use(express.static(__dirname + '/public'));
apiRoutes.init(app);

app.listen(config.get('port'), function onServerStart(){
    console.log('server start on port:'+config.get('port'));
});

