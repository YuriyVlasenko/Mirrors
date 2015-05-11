/**
 * Created by PIPON on 26.02.2015.
 */

var config  = require('./config');
var mongoose = require('mongoose');
var log = require('./log')(module);

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});



