/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var SaleOrderDtl = mongoose.Schema({
    saleOrderDtlId: {type:String, required: true},
    saleOrderId: {type:String, required: true},
    saleItemId: {type:String, required: true},
    customPrice: {type:Number, required: false},
    count: {type:Number, required: true}
});

var model = mongoose.model('SaleOrderDtl',SaleOrderDtl);

module.exports = {
    idField: 'saleOrderDtlId',
    name: 'saleOrderDtl',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.saleOrderDtlId,
            saleOrderId: item.saleOrderId,
            saleItemId: item.saleItemId,
            customPrice: item.customPrice,
            count: item.count
        };
    },
    createItem: function(id, data){
        return new model({
            saleOrderDtlId: id,
            saleOrderId: data.saleOrderId,
            saleItemId: data.saleItemId,
            customPrice: data.customPrice,
            count: data.count
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.count){
            updateData.count = data.count;
        }

        if (data.customPrice){
            updateData.customPrice = data.customPrice;
        }

        return updateData;
    }
};