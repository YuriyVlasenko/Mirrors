/**
 * Created by PIPON on 26.02.2015.
 */

var mongoose = require('mongoose');

var Role = new mongoose.Schema({
    name: { type: String, required: true },
    roleId: { type: String, required: true }
});

var model = mongoose.model('Role', Role);

module.exports = {
    idField: 'roleId',
    name: 'role',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.roleId,
            name: item.name
        };
    },
    createItem: function(id, data){
        return new model({
            roleId: id,
            name: data.name
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
            updateData.name = data.name;
        }

        return updateData;
    }
};