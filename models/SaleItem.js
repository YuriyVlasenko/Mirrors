/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var SaleItem = mongoose.Schema({
    saleItemId: { type: String, required: true},
    categoryId: { type: String, required: true},
    setId: { type: String},
    name: { type: String, required: true},
    code: { type: String},
    comment: { type: String}
});

var model = mongoose.model('SaleItem', SaleItem);

module.exports = {
    idField: 'saleItemId',
    name: 'saleItem',
    dbModel: model,
    clientDataBuilder: function(data){
        return {
            id: data.saleItemId,
            categoryId: data.categoryId,
            setId: data.setId,
            name: data.name,
            code: data.code,
            comment: data.comment
        };
    },
    createItem: function(id, data){
        return new model({
            saleItemId: id,
            setId: data.setId,
            categoryId: data.categoryId,
            name: data.name,
            code: data.code,
            comment: data.comment
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.setId !== undefined){
            updateData.setId = data.setId;
        }

        if (data.categoryId !== undefined){
            updateData.categoryId = data.categoryId;
        }

        if (data.name !== undefined){
            updateData.name = data.name;
        }

        if (data.code !== undefined){
            updateData.code = data.code;
        }

        if (data.comment !== undefined){
            updateData.comment = data.comment;
        }

        return updateData;
    }
}