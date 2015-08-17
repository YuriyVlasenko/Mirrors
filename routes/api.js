/**
 * Created by PIPON on 26.02.2015.
 */
var API_PREFIX = 'api';

var pathManager = require('./pathManager');
var bodyParser = require('body-parser');
var url = require('url');
var path = require('path');
var fileSystem = require('fs');
var multiparty = require('multiparty');
var uuid = require('node-uuid');
var fs = require('fs');
var execFile = require('child_process').execFile;

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

    var wellKnownRoles = {
        admin: '751800e0-06db-11e5-8917-e995f239513c',
        partner: '210ab950-c51a-11e4-aec7-6b9322d76429',
        guest: '14d1dad0-06db-11e5-b015-6dc9c9e875e7'
    };

    function isAdminRole(id){
        return id === wellKnownRoles.admin;
    };

    function isPartnerRole(id){
        return id === wellKnownRoles.partner;
    };

    function isGuestRole(id){
        return id === wellKnownRoles.guest;
    };

    function isWellKnownObject(id){
        if (id === wellKnownRoles.admin || id === wellKnownRoles.partner || id === wellKnownRoles.guest){
            return true;
        }
        return false;
    };

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.status(403).end();
    };

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

    app.get('/api/admin/getBackup', function (req, res) {

        if(!isAdminRole(req.user.roleId)){
            res.sendStatus(403);
            return;
        }

        console.log('getBackup');
        console.log(Date());

        execFile('mongoDbDump.bat', function(error){
            if (error){
                console.log(error);
                res.sendStatus(404);
                return;
            }

            var filePath = path.join(__dirname, '../dump/archive.zip');
            var stat = fileSystem.statSync(filePath);

            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-Length': stat.size
            });

            console.log(filePath);

            var readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(res);
        });
    });

    function accessFilter(modelName, req, items){
        // Only current user
        if (modelName == userModel.name && (isPartnerRole(req.user.roleId) || isGuestRole(req.user.roleId))){
            return items.filter(function(item){
                return  item.userId === req.user.userId;
            });
        }

        // Only current user sale orders
        if (modelName == saleOrderModel.name && isPartnerRole(req.user.roleId)){
            return items.filter(function(item){
                return  item.userId === req.user.userId;
            });
        }
        return items;
    }

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
            app.post(apiPathDelete, ensureAuthenticated, function (req, res) {
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
        app.get(pathManager.buildPath(itemModel.name), ensureAuthenticated, function (req, res) {

            if (isGuestRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case roleModel.name:
                    case priceModel.name:
                    case saleOrderModel.name:
                    case saleOrderDtlModel.name:
                    case saleOrderHeaderModel.name:
                        return res.send([]);
                }
            }

            if(isPartnerRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case roleModel.name:
                        return res.send([]);
                }
            }

            var url_parts = url.parse(req.url, true);
            var query = url_parts.query;

            var searchConditions = itemModel.searchConditions(query);

             // Only current user sale orders details
             if ((itemModel.name == saleOrderDtlModel.name || itemModel.name == saleOrderHeaderModel.name) && isPartnerRole(req.user.roleId)){

                 // Access control for only self orders and details.
                return saleOrderModel.dbModel.find({userId: req.user.userId}, function(error, saleOrderItems){
                     if (error){
                        return res.send([]);
                     }

                     var ordersIds = saleOrderItems.map(function(item){
                        return item.saleOrderId;
                     });

                     if (ordersIds.length == 0){
                         return res.send([]);
                     }

                     return itemModel.dbModel.find(searchConditions, function (err, items) {
                          if (!err) {
                              items = accessFilter(itemModel.name, req, items);

                              items = items.filter(function(item){
                                  return  ordersIds.indexOf(item.saleOrderId) > -1;
                              });

                              return res.send(items.map(function(item){
                                  return itemModel.clientDataBuilder(item);
                              }));

                          } else {
                              res.statusCode = 500;
                              return res.send({ error: 'Server error' });
                          }
                     });
                 });
             }
             else{
                 return itemModel.dbModel.find(searchConditions, function (err, items) {
                     if (!err) {

                         items = accessFilter(itemModel.name, req, items);

                         return res.send(items.map(function(item){
                             return itemModel.clientDataBuilder(item);
                         }));

                     } else {
                         //log.error(ERROR_TEMPLATE,res.statusCode,err.message);
                         res.statusCode = 500;
                         return res.send({ error: 'Server error' });
                     }
                 });
             }
        });

        // Get one item
        app.get(pathManager.buildPath(itemModel.name, ':id'), ensureAuthenticated, function (req, res) {

            if (isGuestRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case roleModel.name:
                    case priceModel.name:
                    case saleOrderModel.name:
                    case saleOrderDtlModel.name:
                    case saleOrderHeaderModel.name:
                        return res.send({});
                }
            }

            if(isPartnerRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case roleModel.name:
                        return res.send({});
                }
            }

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
        app.post(pathManager.buildPath(itemModel.name,'new'), ensureAuthenticated, jsonParser, function (req, res) {

            if (isGuestRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                    case saleOrderModel.name:
                    case saleOrderDtlModel.name:
                    case saleOrderHeaderModel.name:
                        return res.send({});
                }
            }

            if(isPartnerRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                        return res.send({});
                }
            }

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
            console.log(Date());

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
        app.post(pathManager.buildPath(itemModel.name,'delete'), ensureAuthenticated, jsonParser, function (req, res) {

            if (isGuestRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                    case saleOrderModel.name:
                    case saleOrderDtlModel.name:
                    case saleOrderHeaderModel.name:
                        return res.send({status: 'Access denied'});
                }
            }

            if(isPartnerRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                        return res.send({status: 'Access denied'});
                }
            }


            if (!req.body || !req.body.id) {
                return res.sendStatus(400);
            }

            var itemId =  req.body.id;

            // If can not delete.
            if (isWellKnownObject(itemId)){
                res.statusCode = 500;
                res.send({error: 'Server error'});
                res.end();
                return;
            }

            console.log('remove server:' + itemId);
            console.log(Date());

            var conditions = {};
            conditions[itemModel.idField] = itemId;

            // Can not remove approved or confirmed orders
            if(itemModel.name === saleOrderModel.name){
                itemModel.dbModel.find(conditions, function(error, data){
                   if(error){
                       res.statusCode = 500;
                       res.send({error: 'Server error'});
                   }
                    var item = data[0];
                    if(item.isApproved || item.isCompleted){
                        res.statusCode = 500;
                        res.send({error: 'Can not remove approved or confirmed orders.'});
                    }
                    else{
                        removeItem();
                    }
                });
            }
            else{
                removeItem();
            }

            function removeItem(){
                itemModel.dbModel.remove(conditions, function(err) {
                    if (!err) {
                        return res.send({status: 'OK'});
                    }
                    else {
                        res.statusCode = 500;
                        res.send({error: 'Server error'});
                    }
                });
            }

        });

        // Update item
        app.post(pathManager.buildPath(itemModel.name,'update'), ensureAuthenticated, jsonParser, function (req, res) {
            if (isGuestRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                    case saleOrderModel.name:
                    case saleOrderDtlModel.name:
                    case saleOrderHeaderModel.name:
                        return res.send({status: 'Access denied'});
                }
            }

            if(isPartnerRole(req.user.roleId)){
                switch (itemModel.name)
                {
                    case userModel.name:
                    case setModel.name:
                    case setItemModel.name:
                    case roleModel.name:
                    case categoryModel.name:
                    case priceModel.name:
                    case saleItemModel.name:
                    case saleItemDtlModel.name:
                        return res.send({status: 'Access denied'});
                }
            }

            if (!req.body || !req.body.id || !req.body.data) {
                return res.sendStatus(400);
            }

            var itemId =  req.body.id;
            var conditions = {};
            conditions[itemModel.idField] = itemId;

            var updatedValues = itemModel.updateDataBuilder(req.body.data);

            console.log('update '+itemModel.name);
            console.log(updatedValues);
            console.log(Date());

            itemModel.dbModel.findOneAndUpdate(conditions, updatedValues , function(err) {
                if (!err) {
                    console.log('update complete');
                    return res.send({status: 'OK'});
                }
                else {
                    console.log('update error');
                    res.statusCode = 500;
                    res.send({error: 'Server error'});
                    //log.error(ERROR_TEMPLATE, res.statusCode, err.message);
                }
            });
        });
    }
};