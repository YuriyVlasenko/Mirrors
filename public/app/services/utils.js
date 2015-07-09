/**
 * Created by Serg on 22.03.2015.
 */

(function(angular) {
    angular.module('app.services').service('utils', createService);

    createService.$inject = [];

    function createService() {

        return{
            buildPictureSrc:buildPictureSrc,
            getItemById:getItemById,
            findIndexById:findIndexById,
            getActualPrice:getActualPrice,
            filterItems:filterItems,
            getActualPriceForSaleItem:getActualPriceForSaleItem
        };

        function buildPictureSrc(modelName, itemId, formatName){
            formatName = formatName || 'png';
            return '/images/'+modelName+'/'+itemId+'.'+formatName;
        };

        function getItemById(items, id, idFieldName)
        {
            var index = findIndexById(items, id, idFieldName);
            if (index!=-1)
            {
                return items[index];
            }
            return undefined;
        }

        function filterItems(items, condition, conditionField){
            return items.filter(function(item){
                return item[conditionField] === condition;
            });
        }

        function findIndexById(items, id, idFieldName){
            idFieldName = idFieldName|| 'id';
            for(var i = 0; i < items.length; i++)
            {
                if(items[i][idFieldName] === id)
                {
                    return i;
                }
            }
            return -1;
        }

        function getActualPriceForSaleItem(saleItemId,  prices){
            var itemPrices = filterItems(prices, saleItemId, 'saleItemId');
            if(itemPrices.length == 0){
                return {
                    cost:0,
                    inDollars: false
                };
            }
            return getActualPrice(itemPrices);
        }

        function getActualPrice(prices){
            if (prices.length == 1)
            {
                return prices[0];
            }
            prices = prices.sort(SortByDate);
            var currentDate = new Date();
            for (var i=prices.length-1; i>=0; i-- ){
                var priceDate =  new Date(prices[i].fromDate)
                if (priceDate <= currentDate){
                    return prices[i];
                }
                return prices[0];
            }
        }

        function SortByDate(a, b){
            var aDate = new Date(a.fromDate);
            var bDate = new Date(b.fromDate);
            return ((aDate < bDate) ? -1 : ((aDate > bDate) ? 1 : 0));
        }

    }
})(angular);
