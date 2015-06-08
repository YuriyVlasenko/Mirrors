/**
 * Created by Serg on 22.03.2015.
 */

(function(angular) {
    angular.module('app.services').service('basket', createService);

    createService.$inject = ['localStorageService', 'storageKeys'];

    function createService(localStorageService, storageKeys) {

        var lastUpdateDate;
        var currentOrder;

        if(!localStorageService.get(storageKeys.BASKET)){
            localStorageService.add(storageKeys.BASKET,{});
        }

        return{
            getLastUpdateDate:getLastUpdateDate,
            addItem:addItem,
            removeItem:removeItem,
            setBasketDetails:setBasketDetails,
            setBasketComment: setBasketComment,
            getBasketInfo:getBasketInfo,
            getBasketDetails:getBasketDetails,
            getBasketComment:getBasketComment,
            getBasketOrder:getBasketOrder,
            updateItemCount:updateItemCount,
            // add as copy from orders ({id, count})
            fillBasket: fillBasket,
            clear: clear
        };

        function getLastUpdateDate(){
            return lastUpdateDate;
        };

        function setBasketDetails(data){
            localStorageService.set(storageKeys.BASKET_DETAILS, data);
        }

        function setBasketComment(comment){
            return localStorageService.set(storageKeys.BASKET_COMMENT, comment);
        };

        function getBasketDetails(){
            return localStorageService.get(storageKeys.BASKET_DETAILS) || {
                    supplier:'',
                    whom:'',
                    overWhom:'',
                    attornay:'',
                    cause:''
                };
        };

        function getBasketComment(){
            return localStorageService.get(storageKeys.BASKET_COMMENT)|| '';
        };

        function clear(){
            lastUpdateDate = new Date();
            currentOrder = null;

            localStorageService.set(storageKeys.BASKET,{});
            localStorageService.remove(storageKeys.BASKET_ORDER);
            localStorageService.set(storageKeys.BASKET_COMMENT,'');
            localStorageService.set(storageKeys.BASKET_DETAILS,{});
        };

        function getBasketOrder(){
            return localStorageService.get(storageKeys.BASKET_ORDER);
        }

        function fillBasket(order, holdOrder){
            if (holdOrder){
                clear();
                currentOrder = order;
            }

            lastUpdateDate = new Date();

            localStorageService.set(storageKeys.BASKET_ORDER,currentOrder);

            var orderItems = order._saleOrderDtl.map(function(item){
                return{
                    id: item.saleItemId,
                    count: item.count
                }
            });
            // Add items
            angular.forEach(orderItems, function(item){
                addItem(item);
            });
            setBasketDetails(order._saleOrderHeader);
        };

        function addItem(item){
            var bsk = localStorageService.get(storageKeys.BASKET);

            if (bsk[item.id]){
                // Append items
                bsk[item.id].count += item.count || 0;
                if (item.childItemsMap){
                    bsk[item.id].childItemsMap = angular.extend(bsk[item.id].childItemsMap, item.childItemsMap);

                }
            }
            else{
                // Create items.
                bsk[item.id] = {
                    count: item.count || 1,
                    childItemsMap: item.childItemsMap || {}
                };
            }
            localStorageService.set(storageKeys.BASKET, bsk);
            lastUpdateDate = new Date();
        };

        function removeItem(id){
            var bsk = localStorageService.get(storageKeys.BASKET);
            if(bsk[id]){
                bsk[id] = undefined;
                localStorageService.set(storageKeys.BASKET, bsk);
                lastUpdateDate = new Date();
            }
        };

        function updateItemCount(id, count) {
            var bsk = localStorageService.get(storageKeys.BASKET);
            if (bsk[id]) {
                bsk[id].count = count;
                localStorageService.set(storageKeys.BASKET, bsk);
                lastUpdateDate = new Date();
            }
        };

        function getBasketInfo(){
            var allCount = 0;
            var bsk = localStorageService.get(storageKeys.BASKET);
            for(var prop in bsk){
                allCount+= bsk[prop].count;
            }
            return {
                itemsCount: allCount,
                itemsMap: bsk
            };
        };
    }
})(angular);
