/**
 * Created by PIPON on 26.02.2015.
 */
var API_PREFIX = 'api';

var pathManager = require('./pathManager');
var bodyParser = require('body-parser');
var url = require('url');
var path = require('path');
var multiparty = require('multiparty');
var uuid = require('node-uuid');
var fs = require('fs');

var roleModel = require('../models/Role');
var userModel = require('../models/User');
var categoryModel = require('../models/Category');
var setModel = require('../models/Set');
var priceModel = require('../models/Price');
var setItemModel = require('../models/SetItem');
var saleItemModel = require('../models/SaleItem');
var saleItemDtlModel = require('../models/SaleItemDtl');
var saleOrderModel = require('../models/SaleOrder');
var saleOrderDtlModel = require('../models/SaleOrderDtl');
var saleOrderHeaderModel = require('../models/SaleOrderHeader');

module.exports.init = function(app){
    var ERROR_TEMPLATE = 'Internal error(%d): %s';

    // create application/json parser
    var jsonParser = bodyParser.json();

    // create application/x-www-form-urlencoded parser
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    createRoutes(userModel);
    createRoutes(roleModel);
    createRoutes(categoryModel);
    createRoutes(setModel);
    createRoutes(setItemModel);
    createRoutes(saleItemModel);
    createRoutes(saleItemDtlModel);
    createRoutes(priceModel);
    createRoutes(saleOrderModel);
    createRoutes(saleOrderDtlModel);
    createRoutes(saleOrderHeaderModel);

    function createRoutes(itemModel){

        // Only for photo
        if (itemModel.name === 'category' || itemModel.name === 'saleItem')
        {
            var availableFormats = ['png'];
            var apiPathLoad = '/api/upload/'+itemModel.name+'/:id';
            app.post(apiPathLoad, function (req, res) {
                var itemId = req.params.id;
                var form = new multiparty.Form({ maxFilesSize: 5000000});
                form.parse(req, function(err, fields, files) {
                    if (!files || files.file.length == 0)
                    {
                        res.send({status:'ERROR', message:'Can\'t find files.'});
                        return;
                    }
                    var file = files.file[0];
                    var fileNamePaths =  file.originalFilename.split('.');
                    if (fileNamePaths.length == 0)
                    {
                        res.send({status:'ERROR', message:'Can\'t parse filename.'});
                    }
                    var fileType = fileNamePaths[fileNamePaths.length-1];
                    var filePath ="../public/images/"+itemModel.name+'/'+itemId+'.'+fileType;
                    try{

                        var newFileName = path.resolve(__dirname,filePath);
                        fs.createReadStream(file.path).pipe(fs.createWriteStream(newFileName));
                    }
                    catch(error)
                    {
                        res.send({status:'ERROR', message:error.message});
                    }
                    res.send({status:'OK'});
                });
            });
            var apiPathDelete = '/api/upload/delete/'+itemModel.name+'/:id';
            app.post(apiPathDelete, function (req, res) {
                console.log('delete action');
                var itemId = req.params.id;
                var filePathPrefix ="../public/images/"+itemModel.name+'/'+itemId+'.';
                for (var i=0; i<availableFormats.length; i++){
                    var filePath = filePathPrefix +availableFormats[i];
                    var deletedFileName = path.resolve(__dirname,filePath);
                    fs.exists(deletedFileName,function(exists) {
                       if(exists)
                       {
                           fs.unlink(deletedFileName, function (err) {
                               if (err) {
                                   console.log(err);
                                   return;
                               }
                               console.log('successfully deleted: '+deletedFileName);
                           });
                       }
                    });
                }
                res.send({status:'OK'});
            });
        }

        // Get all items route
        app.get(pathManager.buildPath(itemModel.name), function (req, res) {
            var url_parts = url.parse(req.url, true);
            var query = url_parts.query;
            var searchConditions = itemModel.searchConditions(query);
            return itemModel.dbModel.find(searchConditions, function (err, items) {
                if (!err) {
                    return res.send(items.map(function(item){
                        return itemModel.clientDataBuilder(item);
                    }));
                } else {
                    res.statusCode = 500;
                    //log.error(ERROR_TEMPLATE,res.statusCode,err.message);
                    return res.send({ error: 'Server error' });
                }
            });
        });

        // Get one item
        app.get(pathManager.buildPath(itemModel.name, ':id'), function (req, res) {
            var itemId = req.params.id;
            if(!itemId) return res.sendStatus(400);

            var conditions = {};
            conditions[itemModel.idField] = itemId;

            return itemModel.dbModel.find(conditions, function (err, items) {
                if (!err) {
                    if (items.length == 0){
                        return res.send({});
                    }
                    else{
                        return res.send(itemModel.clientDataBuilder(items[0]));
                    }
                } else {
                    res.statusCode = 500;
                    //log.error(ERROR_TEMPLATE,res.statusCode,err.message);
                    return res.send({ error: 'Server error' });
                }
            });
        });

        // Create item.
        app.post(pathManager.buildPath(itemModel.name,'new'),jsonParser, function (req, res) {

            if (!req.body) return res.sendStatus(400);

            var itemId;
            if (req.body.id){
                itemId = req.body.id;
            }
            else{
                itemId = uuid.v1();
            }

            var newItem = new itemModel.createItem(itemId, req.body);

            console.log('create');
            console.log(newItem);

            newItem.save(function(err) {
                if (!err) {
                    return res.send({id:itemId, status: 'OK'});
                }
                else {
                    res.statusCode = 500;
                    res.send({error: 'Server error'});
                    //log.error(ERROR_TEMPLATE, res.statusCode, err.message);
                }
            });
        });

        // Delete item
        app.post(pathManager.buildPath(itemModel.name,'delete'),jsonParser, function (req, res) {
            if (!req.body || !req.body.id) {
                return res.sendStatus(400);
            }

            var itemId =  req.body.id;

            console.log('remove server:' + itemId);

            var conditions = {};
            conditions[itemModel.idField] = itemId;

            console.log(conditions);

            itemModel.dbModel.remove(conditions, function(err) {
                if (!err) {
                    return res.send({status: 'OK'});
                }
                else {
                    res.statusCode = 500;
                    res.send({error: 'Server error'});
                    //log.error(ERROR_TEMPLATE, res.statusCode, err.message);
                }
            });
        });

        // Update item
        app.post(pathManager.buildPath(itemModel.name,'update'),jsonParser, function (req, res) {
            console.log('update '+itemModel.name);
            if (!req.body || !req.body.id || !req.body.data) {
                return res.sendStatus(400);
            }

            var itemId =  req.body.id;
            var conditions = {};
            conditions[itemModel.idField] = itemId;

            var updatedValues = itemModel.updateDataBuilder(req.body.data);

            console.log('update');
            console.log(updatedValues);

            itemModel.dbModel.findOneAndUpdate(conditions, updatedValues , function(err) {
                if (!err) {
                    return res.send({status: 'OK'});
                }
                else {
                    res.statusCode = 500;
                    res.send({error: 'Server error'});
                    //log.error(ERROR_TEMPLATE, res.statusCode, err.message);
                }
            });
        });
    }
};