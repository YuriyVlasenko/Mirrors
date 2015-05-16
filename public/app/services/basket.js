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
            getBasketInfo:getBasketInfo,
            updateItemCount:updateItemCount,
            clear: clear
        };

        function getLastUpdateDate(){
            return lastUpdateDate;
        };

        function clear(){
            lastUpdateDate = new Date();
            localStorageService.set(storageKeys.BASKET,{});
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
