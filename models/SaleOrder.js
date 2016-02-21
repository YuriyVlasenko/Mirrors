/**
 * Created by PIPON on 28.02.2015.
 */

var mongoose = require('mongoose');

var SaleOrder = mongoose.Schema({
    saleOrderId: {type:String, required: true},
    date: {type:Date, required: true},
    userId: {type:String, required: true},
    price: {type:Number},
    priceDollars: {type:Number},
    isApproved: {type:Boolean, default: false},
    isCompleted: {type: Boolean, default:false},
    comment: {type: String},
    response: {type: String},
    deliveryCost: {type:String},
    orderNumber: {type:Number, default: 0}
});

var model = mongoose.model('SaleOrder', SaleOrder);

module.exports = {
    idField: 'saleOrderId',
    name: 'saleOrder',
    dbModel: model,
    clientDataBuilder: function(item){
        return {
            id: item.saleOrderId,
            date: item.date,
            userId: item.userId,
            price: item.price,
            priceDollars: item.priceDollars,
            isApproved: item.isApproved,
            isCompleted: item.isCompleted,
            comment: item.comment,
            response: item.response,
            deliveryCost: item.deliveryCost,
            orderNumber: item.orderNumber || 0
        };
    },
    createItem: function(id, data){
        return new model({
            saleOrderId: id,
            date: data.date,
            userId: data.userId,
            price: data.price,
            priceDollars: data.priceDollars,
            isApproved: data.isApproved,
            isCompleted: data.isCompleted,
            comment: data.comment,
            response: data.response,
            deliveryCost: data.deliveryCost,
            orderNumber: data.orderNumber || 0
        });
    },
    searchConditions: function(data){
        var conditions = {};
        return conditions;
    },
    // Add validation.
    updateDataBuilder: function(data){
        var updateData = {};

        if (data.date){
            updateData.date = data.date;
        }

        if (data.price){
            updateData.price = data.price;
        }

        if (data.priceDollars){
            updateData.priceDollars = data.priceDollars;
        }

        if (data.isApproved !== undefined){
            updateData.isApproved = data.isApproved;
        }

        if (data.isCompleted !== undefined){
            updateData.isCompleted = data.isCompleted;
        }

        if (data.comment){
            updateData.comment = data.comment.substr(0, 250);
        }

        if (data.response){
            updateData.response = data.response.substr(0, 250);
        }

        if (data.deliveryCost){
            updateData.deliveryCost = data.deliveryCost;
        }

        if (data.orderNumber){
            updateData.orderNumber = data.orderNumber;
        }
        return updateData;
    }
};