/**
 * Created by PIPON on 01.03.2015.
 */

var API_PREFIX = 'api';

function buildPath(modelName, operation){
    if (operation){
        return "/"+API_PREFIX+"/"+modelName+"/"+operation;
    }
    else{
        return "/"+API_PREFIX+"/"+modelName+"s";
    }
}

module.exports.buildPath =  buildPath;
