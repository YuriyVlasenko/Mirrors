/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular) {
    angular.module('app').controller('appController', AppController);

    AppController.$inject = ['$scope','basket','repository','modelNames','utils','$mdDialog','toastsPresenter'];
    function AppController($scope,basket, repository, modelNames, utils,$mdDialog,toastsPresenter){

        var saleItems = [];
        var saleItemsMap = {};
        var basketInfo = {};

        repository.reloadModelItems([modelNames.SALE_ITEM, modelNames.PRICE]).then(function(){
            saleItems = repository.getModelItems(modelNames.SALE_ITEM);
            var prices = repository.getModelItems(modelNames.PRICE);

            angular.forEach(saleItems, function(saleItem){
                saleItem.price = utils.getActualPriceForSaleItem(saleItem.id, prices);
                saleItem.priceValue =saleItem.price.cost;
                saleItem.priceInDollars =saleItem.price.inDollars;

                saleItemsMap[saleItem.id] = saleItem;
            });

            $scope.$watch(basket.getLastUpdateDate, function(){
                basketInfo = basket.getBasketInfo();
                $scope.basketInfo = basketInfo;
                reloadBasketData();
            });
        },
        function(){

        });

        $scope.openBasket = function () {

            if(basket.getBasketInfo().itemsCount == 0){
                toastsPresenter.info('В корзине отсутствуют товары.');
                return;
            }
            $mdDialog.show({
                templateUrl:'app/templates/basket.html',
                controller:'basketController'
            });
        };

        function reloadBasketData(){
            var cost = 0;
            var costInDollars = 0;
            for(var bskItemKey in basketInfo.itemsMap){
                var count = basketInfo.itemsMap[bskItemKey].count;

                var saleItem = saleItemsMap[bskItemKey];
                if(saleItem.priceInDollars){
                    costInDollars += saleItem.priceValue*count;
                }
                else{
                    cost += saleItem.priceValue*count;
                }

                var bskItem = basketInfo.itemsMap[bskItemKey];
                if (bskItem && bskItem.childItemsMap){
                    for(var childItemKey in bskItem.childItemsMap){
                        var childItem = bskItem.childItemsMap[childItemKey];
                        if (!childItem.price){
                            continue;
                        }
                        if (childItem.price.inDollars){
                            costInDollars += childItem.price.cost * childItem.count;
                        }
                        else{
                            cost += childItem.price.cost * childItem.count;
                        }
                    }
                }
            };

            $scope.basketInfo.cost = cost;
            $scope.basketInfo.costInDollars = costInDollars;
            //$scope.basketInfo.items
        }

    }
})(angular);