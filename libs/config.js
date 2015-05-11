/**
 * Created by PIPON on 26.02.2015.
 */

var nconf = require('nconf');
var path = require('path');

nconf.argv()
    .env()
    .file({file: path.join(__dirname, '../config/config.json')});

module.exports = nconf;
