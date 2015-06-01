/**
 * Created by Serg on 12.04.2015.
 */

(function(angular) {
    angular.module('app').controller('basketController', BasketController);
    BasketController.$inject = ['$scope', 'toastsPresenter','$mdDialog', 'repository', 'modelNames','basket', 'utils','signIn'];
    function BasketController($scope, toastsPresenter, $mdDialog, repository, modelNames,basket,utils, signIn) {

        var basketInfo = basket.getBasketInfo();

        var saleItemsMap = {};
        var allPrices = [];

        $scope.vm = {};

        $scope.vm.details = basket.getBasketDetails();
        $scope.vm.comment = basket.getBasketComment();

        $scope.basketItems = [];
        $scope.total = 0;
        $scope.totalUsd = 0;

        repository.reloadModelItems([modelNames.SALE_ITEM, modelNames.PRICE]).then(function(){
            saleItemsMap = repository.getModelItemsMap(modelNames.SALE_ITEM);
            allPrices = repository.getModelItems(modelNames.PRICE);

            initBasketItems();
        });

        function calculateTotalValues(){
            $scope.total = 0;
            $scope.totalUsd = 0;
            for(var i=0; i<$scope.basketItems.length; i++){
                var basketItem =  $scope.basketItems[i];
                // Calculate for root items.
                if (basketItem.price.inDollars){
                    $scope.totalUsd+=basketItem.price.cost*basketItem.count;
                }
                else{
                    $scope.total+=basketItem.price.cost*basketItem.count;
                }

                // Calculate for children items.
                if(basketItem.childrens && basketItem.childrens.length > 0){
                    for(var j = 0; j < basketItem.childrens.length; j++){
                        var childItem = basketItem.childrens[j];
                        if (childItem.price.inDollars){
                            $scope.totalUsd+=childItem.price.cost*childItem.count;
                        }
                        else{
                            $scope.total+=childItem.price.cost*childItem.count;
                        }
                    }
                }
            };
        };

        function initBasketItems(){
            for(var basketItemKey in basketInfo.itemsMap){
                var basketItem = basketInfo.itemsMap[basketItemKey];
                var itemInfo = getItemInfo(basketItemKey);
                if (!itemInfo){
                    toastsPresenter.error('Ошибка при определение товара. Очистите корзину.');
                    return;
                };

                var resultItem = angular.extend(itemInfo, {
                    count:basketItem.count,
                    childrens:[]
                });

                // Find and add childrens.
                if (basketItem.childItemsMap){
                    for(var itemKey in basketItem.childItemsMap){
                        var childItem = basketItem.childItemsMap[itemKey];
                        var childItemInfo = getItemInfo(itemKey);
                        if (!childItemInfo){
                            continue;
                        }
                        var childResultItem = angular.extend(childItemInfo, {
                            count:childItem.count,
                            baseCount:childItem.count
                        });

                        resultItem.childrens.push(childResultItem);
                    }
                }
                $scope.basketItems.push(resultItem);
            }
            calculateTotalValues();
        }

        function getItemInfo(itemId){
            var saleItem =  saleItemsMap[itemId];
            if (!saleItem) {
                return undefined;
            }

            var itemInfo = {
                id: saleItem.id,
                name:saleItem.name,
                code: saleItem.code,
                price: utils.getActualPriceForSaleItem(saleItem.id, allPrices)
            };

            itemInfo.price.currency = itemInfo.price.inDollars?'usd.':'грн.';
            return itemInfo;
        }

        $scope.incrementCount = function(item){
            item.count++;
            if(item.childrens){
                for(var i=0; i<item.childrens.length; i++)
                {
                    item.childrens[i].count =item.childrens[i].baseCount*item.count;
                }
            }
            calculateTotalValues();
        };

        $scope.decrementCount = function(item){
            if(item.count > 0) {
                item.count--;
                if (item.childrens) {
                    for (var i = 0; i < item.childrens.length; i++) {
                        item.childrens[i].count = item.childrens[i].baseCount * item.count;
                    }
                }
            }
            calculateTotalValues();
        };

        $scope.removeItem = function(item, parentItem){
            if(parentItem){
                var childIndex =  utils.findIndexById(parentItem.childrens, item.id, 'id');
                parentItem.childrens.splice(childIndex,1);
            }
            else{
                var index =  utils.findIndexById($scope.basketItems, item.id, 'id');
                $scope.basketItems.splice(index,1);
            }
            calculateTotalValues();
        };

        $scope.saveToBasket = function(){
            basket.clear();
            for(var i=0; i<$scope.basketItems.length; i++)
            {
                var item = $scope.basketItems[i];
                var basketItem = {
                    id:item.id,
                    count:item.count
                };

                if(item.childrens){
                    basketItem.childItemsMap = {};
                    for(var j=0; j<item.childrens.length; j++)
                    {
                        var childItem = item.childrens[j];
                        basketItem.childItemsMap[childItem.id] = childItem;
                    }
                }
                basket.addItem(basketItem);
            }

            basket.setBasketDetails($scope.vm.details);
            basket.setBasketComment($scope.vm.comment);

            toastsPresenter.info('Корзина обновлена');
            $mdDialog.cancel();
        };

        $scope.clearBasket = function(){
            basket.clear();
            $mdDialog.cancel();

            $scope.vm.details = basket.getBasketDetails();
            $scope.vm.comment = basket.getBasketComment();
        };

        $scope.orderItems = function(){

            if($scope.basketItems.length == 0){
                toastsPresenter.info('Корзина пуста');
                return;
            }

            var userData = signIn.getUserData();

            var salesOrder = {
                date: new Date(),
                userId: userData.id,
                price: $scope.total.toFixed(2),
                priceDollars: $scope.totalUsd.toFixed(2),
                isApproved: false,
                isCompleted: false,
                comment: $scope.vm.comment,
                response:'',
                deliveryCost: 0
            };


            repository.createModelItem(modelNames.SALE_ORDER, salesOrder).then(function(data){

                var saleOrderDtlCreateCompleted = true;
                var orderId = data.id;

                // find all saleOrderItems.
                var saleOrderItems = [];
                for(var i=0; i<$scope.basketItems.length; i++){
                    var basketItem = $scope.basketItems[i];

                    saleOrderItems.push({
                        saleItemId: basketItem.id,
                        count: basketItem.count
                    });

                    if(basketItem.childrens){
                        for(var j=0; j<basketItem.childrens.length; j++)
                        {
                            var childItem = basketItem.childrens[j];
                            saleOrderItems.push({
                                saleItemId:childItem.id,
                                count: childItem.count
                            });
                        }
                    }
                }

                var uniqueItemsMap = {};
                angular.forEach(saleOrderItems, function (item) {
                    if(uniqueItemsMap[item.saleItemId]){
                        uniqueItemsMap[item.saleItemId].count += item.count;
                    }
                    else{
                        uniqueItemsMap[item.saleItemId] = {
                            saleOrderId:orderId,
                            saleItemId:item.saleItemId,
                            count: item.count
                        };
                    }
                });

                for(var saleItemKey in uniqueItemsMap){
                    var saleItem = uniqueItemsMap[saleItemKey];
                    repository.createModelItem(modelNames.SALE_ORDER_DTL, saleItem).then(function(){

                    }, function(error){
                        console.error(error);
                        saleOrderDtlCreateCompleted = false;
                    });

                    if (!saleOrderDtlCreateCompleted){
                        break;
                    }
                }

                if (saleOrderDtlCreateCompleted){

                    $scope.vm.details.id = orderId;
                    repository.createModelItem(modelNames.SALE_ORDER_HEADER, $scope.vm.details).catch(function (error) {
                        console.log('SALE_ORDER_HEADER');
                        console.error(error);
                    });

                    toastsPresenter.info('Заказ оформлен');
                }
                else{
                    toastsPresenter.info('Ошибка при оформлении заказа');
                }

                console.log('order created');
                console.log(data);
                $scope.clearBasket();
            }, function(error){
                console.log('error');
                console.log(error);
            });
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };

    }
})(angular);
