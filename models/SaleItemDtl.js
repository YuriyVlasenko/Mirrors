/**
 * Created by PIPON on 01.03.2015.
 */

var mongoose = require('mongoose');

var SaleItemDtl = mongoose.Schema({
    saleItemId: {type: String, required: true},
    height:{type:Number},
    width:{type:Number},
    color:{type:String},
    other:{type:String}
});

var model = mongoose.model('SaleItemDtl', SaleItemDtl);

module.exports = {
    idField: 'saleItemId',
    name: 'saleItemDtl',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.saleItemId,
            height: item.height,
            width: item.width,
            color: item.color,
            other: item.other
        };
    },
    createItem: function(id, data){
        return new model({
            saleItemId: id,
            height: data.height,
            width: data.width,
            color: data.color,
            other: data.other
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.height){
            updateData.height = data.height;
        }

        if (data.width){
            updateData.width = data.width;
        }

        if (data.color){
            updateData.color = data.color;
        }

        if (data.other){
            updateData.other = data.other;
        }

        return updateData;
    }
};