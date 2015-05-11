/**
 * Created by Serg on 04.05.2015.
 */


(function (angular) {
    angular.module('app.services').filter('saleItemFilter', function() {
        return function (inputArray, accessoryCategoryId) {
            return inputArray.filter(function(item){
                if(!item._saleItem) return true;
                if(!item._saleItem.categoryId) return true;
                return item._saleItem.categoryId !== accessoryCategoryId;
            });
        };
    }).filter('saleAccessoryFilter', function() {
        return function (inputArray, accessoryCategoryId) {
            return inputArray.filter(function(item){
                if(!item._saleItem) return false;
                if(!item._saleItem.categoryId) return false;
                return item._saleItem.categoryId === accessoryCategoryId;
            });
        };
    })
})(angular);
