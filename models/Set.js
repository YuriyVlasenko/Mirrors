/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var Set = mongoose.Schema({
    setId: { type: String, required: true},
    name: { type:String, required: true},
    description: { type:String}
});

var model = mongoose.model('Set', Set);

module.exports = {
    idField: 'setId',
    name: 'set',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.setId,
            name: item.name,
            description: item.description
        };
    },
    createItem: function(id, data){
        return new model({
            setId: id,
            name: data.name,
            description: data.description
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

        if (data.description){
            updateData.description = data.description;
        }

        return updateData;
    }
};
