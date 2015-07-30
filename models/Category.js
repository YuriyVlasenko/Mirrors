/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var Category = mongoose.Schema({
    categoryId: { type: String, required: true},
    name: { type: String, required: true},
    comment: { type: String},
    parentId: { type: String}
});

var model =  mongoose.model('Category',Category);

module.exports = {
    idField: 'categoryId',
    name: 'category',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.categoryId,
            name: item.name,
            comment: item.comment,
            parentId: item.parentId
        };
    },
    createItem: function(id, data){
        return new model({
            categoryId: id,
            name: data.name,
            comment: data.comment,
            parentId: data.parentId
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.name){
            updateData.name = data.name.substr(0, 250);
        }

        if (data.comment){
            updateData.comment = data.comment.substr(0, 250);
        }

        updateData.parentId = data.parentId?data.parentId:'';

        return updateData;
    }
};