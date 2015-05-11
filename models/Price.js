/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var Price = mongoose.Schema({
    priceId: {type: String, required: true},
    saleItemId: {type: String, required: true},
    cost: {type: Number, required: true},
    fromDate: {type: Date, required: true},
    inDollars: { type: Boolean, default: false}
});

var model = mongoose.model('Price',Price);

module.exports = {
    idField: 'priceId',
    name: 'price',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.priceId,
            saleItemId: item.saleItemId,
            fromDate: item.fromDate,
            cost: item.cost,
            inDollars: item.inDollars
        };
    },
    createItem: function(id, data){
        return new model({
            priceId: id,
            saleItemId: data.saleItemId,
            fromDate: data.fromDate,
            cost: data.cost,
            inDollars: data.inDollars
        });
    },
    searchConditions: function(data){
        var conditions = {};
        if (data.saleItemId)
        {
            conditions.saleItemId = data.saleItemId;

        }
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){

        var updateData = {};

        if (data.fromDate){
            updateData.fromDate = data.fromDate;
        }

        if (data.cost){
            updateData.cost = data.cost;
        }

        if (data.inDollars !== undefined){
            updateData.inDollars = data.inDollars;
        }

        return updateData;
    }
};