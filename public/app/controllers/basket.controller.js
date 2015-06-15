/**
 * Created by Serg on 12.04.2015.
 */

(function(angular) {
    angular.module('app').controller('basketController', BasketController);
    BasketController.$inject = ['$scope','$q', 'toastsPresenter','$mdDialog', 'repository', 'modelNames','basket', 'utils','signIn'];
    function BasketController($scope,$q, toastsPresenter, $mdDialog, repository, modelNames,basket,utils, signIn) {

        var basketInfo = basket.getBasketInfo();

        var saleItemsMap = {};
        var allPrices = [];

        $scope.vm = {};

        $scope.vm.details = basket.getBasketDetails();
        $scope.vm.comment = basket.getBasketComment();
        $scope.vm.order = basket.getBasketOrder();

        $scope.basketItems = [];
        $scope.total = 0;
        $scope.totalUsd = 0;

        $scope.calculateTotalValues = calculateTotalValues;

        repository.reloadModelItems([modelNames.SALE_ITEM, modelNames.PRICE]).then(function(){
            saleItemsMap = repository.getModelItemsMap(modelNames.SALE_ITEM);
            allPrices = repository.getModelItems(modelNames.PRICE);

            initBasketItems();
        });

        $scope.$watch(function(){
            return signIn.getUserData();
        }, function(value){
            $scope.vm.userData = value;
        });

        function calculateTotalValues(){
            $scope.total = 0;
            $scope.totalUsd = 0;
            for(var i=0; i<$scope.basketItems.length; i++){
                var basketItem =  $scope.basketItems[i];
                // Calculate for root items.
                if (basketItem.price.inDollars){
                    $scope.totalUsd += basketItem.customPrice*basketItem.count;
                }
                else{
                    $scope.total+=basketItem.customPrice*basketItem.count;
                }

                // Calculate for children items.
                if(basketItem.childrens && basketItem.childrens.length > 0){
                    for(var j = 0; j < basketItem.childrens.length; j++){
                        var childItem = basketItem.childrens[j];
                        if (childItem.price.inDollars){
                            $scope.totalUsd += childItem.customPrice*childItem.count;
                        }
                        else{
                            $scope.total += childItem.customPrice*childItem.count;
                        }
                    }
                }
            };
        };

        function initBasketItems(){
            for(var basketItemKey in basketInfo.itemsMap){
                var basketItem = basketInfo.itemsMap[basketItemKey];
                var itemInfo = getItemInfo(basketItemKey);

                itemInfo.customPrice = basketItem.customPrice || itemInfo.price.cost;

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
                        childItemInfo.customPrice = childItemInfo.customPrice || childItemInfo.price.cost;

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
            if(item.count > 1) {
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

        $scope.updateItems = function(){
            if($scope.basketItems.length == 0){
                toastsPresenter.info('Корзина пуста');
                return;
            }

            var salesOrder = {
                date: new Date(),
                price: $scope.total.toFixed(2),
                priceDollars: $scope.totalUsd.toFixed(2),
                comment: $scope.vm.comment
            };
            repository.updateModelItem(modelNames.SALE_ORDER, $scope.vm.order.id, salesOrder).then(
                 function(){
                     var removePromises = [];
                     for(var i=0; i <$scope.vm.order._saleOrderDtl.length; i++ )
                     {
                         var detail = $scope.vm.order._saleOrderDtl[i];
                         removePromises.push(repository.removeModelItem(modelNames.SALE_ORDER_DTL, detail.id));
                     }
                     $q.all(removePromises).then(function(data){
                         saveDetails($scope.vm.order.id);
                         basket.clear();
                         $mdDialog.cancel();
                     }, function(error){
                         toastsPresenter.error('Ошибка удаления заказа');
                         console.log(error);
                     });
                 },
                 function(error){
                     console.log('error');
                     console.log(error);
                 }
            );
        };

        $scope.clearBasket = function(){
            basket.clear();
            $mdDialog.cancel();

            $scope.vm.details = basket.getBasketDetails();
            $scope.vm.comment = basket.getBasketComment();
            $scope.vm.order = basket.getBasketOrder();
        };

        function saveDetails(orderId){
            var saleOrderDtlCreateCompleted = true;

            // find all saleOrderItems.
            var saleOrderItems = [];
            for(var i=0; i<$scope.basketItems.length; i++){
                var basketItem = $scope.basketItems[i];

                var orderItemData = {
                    saleItemId: basketItem.id,
                    count: basketItem.count
                };

                if ($scope.vm.userData.isAdmin){
                    orderItemData.customPrice = basketItem.customPrice;
                }

                saleOrderItems.push(orderItemData);

                if(basketItem.childrens){
                    for(var j=0; j<basketItem.childrens.length; j++)
                    {
                        var childItem = basketItem.childrens[j];
                        var saleOrderItemData = {
                            saleItemId: childItem.id,
                            count: childItem.count
                        };

                        if ($scope.vm.userData.isAdmin){
                            saleOrderItemData.customPrice = childItem.customPrice;
                        }

                        saleOrderItems.push(saleOrderItemData);
                    }
                }
            }

            var uniqueItemsMap = {};
            angular.forEach(saleOrderItems, function (item) {
                if(uniqueItemsMap[item.saleItemId]){
                    uniqueItemsMap[item.saleItemId].count += item.count;
                }
                else{

                    var uniqueItemsMapItem = {
                        saleOrderId:orderId,
                        saleItemId:item.saleItemId,
                        count: item.count
                    };

                    if ($scope.vm.userData.isAdmin){
                        uniqueItemsMapItem.customPrice = item.customPrice;
                    }

                    uniqueItemsMap[item.saleItemId] = uniqueItemsMapItem;
                }
            });

            for(var saleItemKey in uniqueItemsMap){
                var saleItem = uniqueItemsMap[saleItemKey];
                debugger;
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

                toastsPresenter.info('Заказ оформлен/обновлен');
            }
            else{
                toastsPresenter.info('Ошибка при оформлении/обновлении заказа');
            }

        }

        $scope.orderItems = function(){

            if($scope.basketItems.length == 0){
                toastsPresenter.info('Корзина пуста');
                return;
            }

            var salesOrder = {
                date: new Date(),
                userId: $scope.vm.userData.id,
                price: $scope.total.toFixed(2),
                priceDollars: $scope.totalUsd.toFixed(2),
                isApproved: false,
                isCompleted: false,
                comment: $scope.vm.comment,
                response:'',
                deliveryCost: 0
            };


            repository.createModelItem(modelNames.SALE_ORDER, salesOrder).then(function(data){
                saveDetails(data.id);
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
