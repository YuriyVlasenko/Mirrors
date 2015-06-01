/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var User = new mongoose.Schema({
    userId: { type: String, required: true},
    login: { type: String, required: true},
    password: { type: String, required: true},
    fio: { type: String, required: true},
    roleId: { type: String, required: true},
    isActive: { type: Boolean, required: true},
    comment: { type: String}
});

var model = mongoose.model('User', User);

module.exports = {
    idField: 'userId',
    name: 'user',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.userId,
            login: item.login,
            fio: item.fio,
            roleId: item.roleId,
            comment: item.comment,
            isActive: item.isActive
        };
    },
    createItem: function(id, data){
        return new model({
            userId: id,
            login: data.login,
            password: data.password,
            fio: data.fio,
            roleId: data.roleId,
            comment: data.comment,
            isActive: data.isActive
        });
    },
    searchConditions: function(data){
        var conditions = {};

        if (data.login){
            conditions.login =data.login;
        }

        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.password){
            updateData.password = data.password;
        }

        if(data.isActive !== undefined)
        {
            updateData.isActive = data.isActive;
        }

        if (data.fio){
            updateData.fio = data.fio;
        }

        if (data.roleId){
            updateData.roleId = data.roleId;
        }

        if (data.comment){
            updateData.comment = data.comment;
        }

        return updateData;
    }
};