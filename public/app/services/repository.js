/**
 * Created by Serg on 04.04.2015.
 */

(function(angular){
    angular.module('app.services').service('repository', createService);

    createService.$inject = ['$q','ModelsManager','modelNames', 'utils'];

    function createService($q, ModelsManager,modelNames, utils){

        var dataHolder = [];

        this.reloadModelItems = function(modelNames){

            if (typeof modelNames === 'string')
            {
                modelNames = [modelNames];
            }

            var promises = [];
            for(var i=0; i<modelNames.length; i++)
            {
                promises.push(loadItems(modelNames[i]));
            }

            return $q.all(promises);
        };

        this.getModelItems = function(modelName){

            var items = [];

            if (dataHolder[modelName] !== undefined && dataHolder[modelName].itemsList != undefined){
                items = dataHolder[modelName].itemsList;
            }

            if (modelName === modelNames.SALE_ORDER){
                items.map(function (item){
                    item.routeOrderNumber = function (){
                        return item.routeNumber * 10000 + item.orderNumber;
                    } 
                })
            }

            return items;
        };

        this.loadFilteredModelItems = function(modelName, filter){
            return new ModelsManager(modelName).getAll(filter);
        };

        this.getModelItemsMap = function(modelName){
            if (dataHolder[modelName] !== undefined && dataHolder[modelName].itemsMap != undefined){
                return dataHolder[modelName].itemsMap;
            }
            return {};
        };


        this.buildModelItemData = function(modelName, data){

            var dataList = data || dataHolder[modelName] && dataHolder[modelName].itemsList;
            // Load user dependencies.
            if (modelName === modelNames.USER){
                if(dataHolder[modelNames.ROLE]) {
                    var roleMap = dataHolder[modelNames.ROLE].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._role =  roleMap[item.roleId];
                        });
                    }
                }
            }

            // Load parent category.
            if (modelName === modelNames.CATEGORY){
                if(dataHolder[modelNames.CATEGORY]) {
                    var categoriesMap = dataHolder[modelNames.CATEGORY].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._category =  categoriesMap[item.parentId];
                        });
                    }
                }
                // Add picture
                if(dataList){
                    angular.forEach(dataList, function (item) {
                        item.pictureSrc = utils.buildPictureSrc(modelName, item.id);
                    });
                }
            }

            // Load saleItems data for set items.
            if (modelName === modelNames.SET_ITEM){
                if(dataHolder[modelNames.SALE_ITEM]) {
                    var saleItemsMap = dataHolder[modelNames.SALE_ITEM].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._saleItem =  saleItemsMap[item.saleItemId];
                        });
                    }
                }
            }

            // Load date for sale item.
            if (modelName === modelNames.SALE_ITEM){
                if(dataHolder[modelNames.SALE_ITEM_DTL]) {
                    var saleItemsDtlMap = dataHolder[modelNames.SALE_ITEM_DTL].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._saleItemDtl =  saleItemsDtlMap[item.id];
                        });
                    }
                }

                if(dataHolder[modelNames.CATEGORY]) {
                    var categoriesMap = dataHolder[modelNames.CATEGORY].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._category =  categoriesMap[item.categoryId];
                        });
                    }
                }

                if(dataHolder[modelNames.SET]) {
                    var setMap = dataHolder[modelNames.SET].itemsMap;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._set =  setMap[item.setId];
                        });
                    }
                }

                if(dataHolder[modelNames.PRICE]) {
                    var prices = dataHolder[modelNames.PRICE].itemsList;

                    if(dataList){
                        angular.forEach(dataList, function (item) {
                            item._price =  utils.getActualPriceForSaleItem(item.id, prices);
                            item._price.currency = item._price.inDollars ? 'usd.':'грн.';
                        });
                    }
                }
                // Add picture
                if(dataList){
                    angular.forEach(dataList, function (item) {
                        item.pictureSrc = utils.buildPictureSrc(modelName, item.id);
                    });
                }
            }

            // Load data for sale order.
            if (modelName === modelNames.SALE_ORDER){

                if(dataHolder[modelNames.SALE_ORDER_HEADER]){
                    var orderHeaderMap = dataHolder[modelNames.SALE_ORDER_HEADER].itemsMap;
                    if(dataList) {
                        angular.forEach(dataList, function (item) {
                            item._saleOrderHeader = orderHeaderMap[item.id];
                        });
                    }
                }

                if(dataHolder[modelNames.USER]){
                    var userMap = dataHolder[modelNames.USER].itemsMap;
                    if(dataList) {
                        angular.forEach(dataList, function (item) {
                            item._user = userMap[item.userId];
                        });
                    }
                }

                if(dataHolder[modelNames.SALE_ORDER_DTL] && dataHolder[modelNames.SALE_ITEM]) {
                    if(dataList){
                        var orderDtlList = dataHolder[modelNames.SALE_ORDER_DTL].itemsList;

                        this.buildModelItemData(modelNames.SALE_ITEM);

                        var saleItemsMap = dataHolder[modelNames.SALE_ITEM].itemsMap;

                        angular.forEach(dataList, function (item) {

                            item._saleOrderDtl =  utils.filterItems(orderDtlList, item.id, 'saleOrderId');

                            angular.forEach(item._saleOrderDtl, function(orderItem){
                                orderItem._saleItem = saleItemsMap[orderItem.saleItemId];
                            });
                        });
                    }
                }
            }
        };

        this.getModelItem = function(modelName, id){
            return new ModelsManager(modelName).getOne(id);
        };

        this.updateModelItem = function(modelName, id, data){
            return new ModelsManager(modelName).update(id, data);
        };

        this.removeModelItem = function(modelName, id){
            return new ModelsManager(modelName).remove(id);
        };

        this.createModelItem = function(modelName, data){
            return new ModelsManager(modelName).create(data);
        };

        function loadItems(modelName){
            return new ModelsManager(modelName).getAllWithMap().then(function(data){
                dataHolder[modelName] = dataHolder[modelName] || {};
                dataHolder[modelName].itemsList = data.itemsList;
                dataHolder[modelName].itemsMap = data.itemsMap;
            }, function () {
                console.error('Ошибка при загрузке: ' + modelName);
            });
        }

    }
})(angular);


