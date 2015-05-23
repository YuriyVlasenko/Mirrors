/**
 * Created by Serg on 22.03.2015.
 */

(function(angular) {
    angular.module('app.services').service('basket', createService);

    createService.$inject = ['localStorageService', 'storageKeys'];

    function createService(localStorageService, storageKeys) {

        var lastUpdateDate;

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
            updateItemCount:updateItemCount,
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
            return localStorageService.get(storageKeys.BASKET_COMMENT) || '';
        };

        function clear(){
            lastUpdateDate = new Date();
            localStorageService.set(storageKeys.BASKET,{});
            localStorageService.set(storageKeys.BASKET_COMMENT,{});
            localStorageService.set(storageKeys.BASKET_DETAILS,{});
        }

        function addItem(item){

            var bsk = localStorageService.get(storageKeys.BASKET);
            if (!bsk[item.id]){

                bsk[item.id] = {
                    count: item.count || 1,
                    childItemsMap: item.childItemsMap||{}
                };

                localStorageService.set(storageKeys.BASKET, bsk);
                lastUpdateDate = new Date();
            }
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
