/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var SaleOrderHeader = mongoose.Schema({
    saleOrderId: {type:String, required: true },
    supplier: {type:String},
    whom: {type:String},
    overWhom: {type:String},
    attornay: {type:String},
    cause: {type:String}
});

var model = mongoose.model('SaleOrderHeader',SaleOrderHeader);

module.exports = {
    idField: 'saleOrderId',
    name: 'saleOrderHeader',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.saleOrderId,
            supplier: item.supplier,
            whom: item.whom,
            overWhom: item.overWhom,
            attornay: item.attornay,
            cause: item.cause
        };
    },
    createItem: function(id, data){
        return new model({
            saleOrderId: id,
            supplier: data.supplier,
            whom: data.whom,
            overWhom: data.overWhom,
            attornay: data.attornay,
            cause: data.cause
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.supplier){
            updateData.supplier = data.supplier;
        }

        if (data.whom){
            updateData.whom = data.whom;
        }

        if (data.overWhom){
            updateData.overWhom = data.overWhom;
        }

        if (data.attornay){
            updateData.attornay = data.attornay;
        }

        if (data.cause){
            updateData.cause = data.cause;
        }

        return updateData;
    }
};