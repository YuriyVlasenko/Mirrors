/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var SetItem = mongoose.Schema({
    setItemId:{ type:String, required: true},
    setId: { type: String, required: true},
    saleItemId: { type:String, required: true},
    count: { type:Number, required: true}
});

var model = mongoose.model('SetItem', SetItem);

module.exports = {
    idField: 'setItemId',
    name: 'setItem',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.setItemId,
            setId: item.setId,
            saleItemId: item.saleItemId,
            count: item.count
        };
    },
    createItem: function(id, data){
        return new model({
            setItemId: id,
            setId: data.setId,
            saleItemId: data.saleItemId,
            count: data.count
        });
    },
    searchConditions: function(data){
        var conditions = {};

        if (data.setId)
        {
            conditions.setId = data.setId;
        }

        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.count){
            updateData.count = data.count;
        }

        return updateData;
    }
};