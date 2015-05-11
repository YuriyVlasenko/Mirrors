/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){

    angular.module('app', ['ui.router','ui.grid','ui.grid.autoResize','ngMaterial',
        'app.services','app.models','angularFileUpload','LocalStorageModule']
    ).config(configure);

    // Configure routes.
    configure.$inject = ['$stateProvider','$urlRouterProvider'];
    function configure($stateProvider,$urlRouterProvider){

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/main");

        $stateProvider.state('main', {
            url: "/main",
            templateUrl:'app/templates/main.html',
            controller:'mainController'
        }).state('users', {
            url: "/users",
            templateUrl:'app/templates/users.html',
            controller:'usersController'
        }).state('roles', {
            url: "/roles",
            templateUrl:'app/templates/roles.html',
            controller:'rolesController'
        }).state('sets', {
            url: "/sets",
            templateUrl:'app/templates/sets.html',
            controller:'setsController'
        }).state('categories', {
            url: "/categories",
            templateUrl:'app/templates/categories.html',
            controller:'categoriesController'
        }).state('saleItems', {
            url: "/saleItems",
            templateUrl:'app/templates/saleItems.html',
            controller:'saleItemsController'
        }).state('orders', {
            url: "/orders",
            templateUrl:'app/templates/orders.html',
            controller:'ordersController'
        }).state('print', {
            url: "/print",
            templateUrl:'app/templates/print.html',
            controller:'printController'
        });


    }
})(angular);

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

/**
 * Created by Serg on 12.04.2015.
 */

(function(angular) {
    angular.module('app').controller('basketController', BasketController);
    BasketController.$inject = ['$scope', 'toastsPresenter','$mdDialog', 'repository', 'modelNames','basket', 'utils'];
    function BasketController($scope, toastsPresenter, $mdDialog, repository, modelNames,basket,utils) {

        var basketInfo = basket.getBasketInfo();

        var saleItemsMap = {};
        var allPrices = [];

        $scope.comment = '';
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
            toastsPresenter.info('Корзина обновлена');
            $mdDialog.cancel();
        };

        $scope.clearBasket = function(){
            basket.clear();
            $mdDialog.cancel();
        };

        $scope.orderItems = function(){

            if($scope.basketItems.length == 0){
                toastsPresenter.info('Корзина пуста');
                return;
            }

            // TODO: modify
            var salesOrder = {
                date: new Date(),
                userId: '1d5f2d70-eb2d-11e4-a000-29c1ad076ab3',
                price: $scope.total,
                priceDollars: $scope.totalUsd,
                isApproved: false,
                isCompleted: false,
                comment: $scope.comment,
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

                    var headerData = {
                        id: orderId,
                        supplier:'',
                        whom:'',
                        overWhom:'',
                        attornay:'',
                        cause:''
                    };

                    repository.createModelItem(modelNames.SALE_ORDER_HEADER, headerData).catch(function (error) {
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

/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('categoriesController', CategoriesController);

    CategoriesController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames'];
    function CategoriesController($scope,$mdDialog,toastsPresenter,repository,modelNames){
        console.log('CategoriesController controller load');
        var categoriesList;
        var gridAPI;
        $scope.vm = {};

        reloadItems();

        $scope.addItem = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/category.html',
                controller:'categoryController',
                locals: { dialogData: {titleText: "Добавление категории", categories: categoriesList}}
            });

            dialogPromise.then(function(modelData){

                if (!modelData)
                {
                    console.error('Form data is empty');
                    return;
                }

                repository.createModelItem(modelNames.CATEGORY, modelData).then(function () {
                    toastsPresenter.operationSucceeded();
                    reloadItems();
                }, function (error) {
                    console.log(error);
                    toastsPresenter.error('Возникла ошибка');
                });

            }, function () {
                toastsPresenter.operationCanceled();
            });
        };

        $scope.editItem = function(itemId){
            repository.getModelItem(modelNames.CATEGORY, itemId).then(function(data){

                var parentCategories = categoriesList.filter(function(element){
                    return element.id !== itemId;
                });

                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/category.html',
                    controller:'categoryController',
                    locals: { dialogData: {
                        titleText: "Изменение категории",
                        model: data,
                        categories: parentCategories}}
                });

                dialogPromise.then(function(modelData){
                    if (!modelData)
                    {
                        console.error('Form data is empty');
                        return;
                    }

                    repository.updateModelItem(modelNames.CATEGORY, itemId, modelData).then(function () {
                        toastsPresenter.operationSucceeded();
                        reloadItems();
                    }, function (error) {
                        console.log(error);
                        toastsPresenter.error('Возникла ошибка');
                    });

                }, function () {
                    toastsPresenter.operationCanceled();
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.CATEGORY, itemId).then(function(){
                toastsPresenter.operationSucceeded();
                reloadItems();
            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
            });
        };

        $scope.vm.gridOptions = {
            columnDefs: [
                {field: 'name', displayName:'Название категории'},
                {field: '_category.name', displayName:'Принадлежит'},
                {
                    field: ' ',
                    width:'80',
                    displayName:'',
                    enableColumnMenu: false,
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                    '</div>'

                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        function reloadItems(){

            repository.reloadModelItems(modelNames.CATEGORY).then(function(){
                repository.buildModelItemData(modelNames.CATEGORY);
                categoriesList = repository.getModelItems(modelNames.CATEGORY);
                $scope.vm.gridOptions.data = categoriesList;

            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
                categoriesList = [];
                $scope.vm.gridOptions.data = categoriesList;
            });
        }
    }
})(angular);


/**
 * Created by PIPON on 01.03.2015.
 */

(function(angular) {
    angular.module('app').controller('mainController', MainController);

    MainController.$inject = ['$scope','$mdDialog','modelNames','toastsPresenter','utils','repository','basket'];
    function MainController($scope,$mdDialog,modelNames,toastsPresenter,utils,repository,basket) {

        var rootBreadcrumb = {
            name:'Все категории',
            index: 0
        };

        $scope.selectedCategory = {};
        $scope.breadcrumbItems = [rootBreadcrumb];
        $scope.selectCategoryItem = selectCategoryItem;
        $scope.loadBreadcrumbItem = loadBreadcrumbItem;
        $scope.showPhoto = showPhoto;
        $scope.addToBasket = addToBasket;


        $scope.nameFilter = function(actual, expected){
            console.log(actual);
            console.log(expected);
            return true;
        };

        var allCategories = [];
        var allSaleItems = [];
        var allSetItems = [];
        var allPrices = [];

        repository.reloadModelItems([modelNames.CATEGORY,modelNames.SALE_ITEM, modelNames.PRICE, modelNames.SET_ITEM]).then(function (data) {

            // TODO: check.

            allCategories = repository.getModelItems(modelNames.CATEGORY);
            allSetItems = repository.getModelItems(modelNames.SET_ITEM);


            repository.buildModelItemData(modelNames.SALE_ITEM);
            repository.buildModelItemData(modelNames.CATEGORY);

            // Load root categories.
            $scope.categories = getChildCategories(undefined, true);

            allSaleItems = repository.getModelItems(modelNames.SALE_ITEM);

            allPrices = repository.getModelItems(modelNames.PRICE);


            // Add sales items to category
            angular.forEach(allCategories, function(item){
                item.saleItems = allSaleItems.filter(function(saleItem){
                    return saleItem.categoryId === item.id;
                });
            });
        });

        function addToBasket(item){

            console.log(allSetItems);

            if (!item){
                return;
            }
            if (item.setId){
                var childItemsMap = {};
                // Get set items
                var setItems = utils.filterItems(allSetItems,item.setId,'setId');
                for(var i=0; i< setItems.length; i++){
                    var setItem = setItems[i];
                    childItemsMap[setItem.saleItemId] = {
                        id:setItem.saleItemId,
                        count: setItem.count,
                        price: utils.getActualPriceForSaleItem(setItem.saleItemId, allPrices)
                    };
                }
                item.childItemsMap = childItemsMap;
            }

            console.log('addToBasket');
            console.log(item);
            basket.addItem(item);
        };

        function showPhoto(salesItem){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/photoView.html',
                locals: { item: {title: salesItem.name, photoSrc:salesItem.pictureSrc }},
                controller: function(scope, $mdDialog, item){
                    scope.item = item;
                    scope.closeDialog = function() {
                        $mdDialog.hide();
                    }
                }
            });
        };

        function loadBreadcrumbItem(breadcrumbItem){
            // Load category items.
            $scope.categories = getChildCategories(breadcrumbItem.categoryId);
            // Remove next items.
            $scope.breadcrumbItems.splice(breadcrumbItem.index + 1);
            $scope.saleItems = [];
        }

        function selectCategoryItem(categoryItem){
            $scope.selectedCategory = categoryItem;
            $scope.saleItems = categoryItem.saleItems;

            // Save path.
            $scope.breadcrumbItems.push({
                categoryId: categoryItem.id,
                name: categoryItem.name,
                index: $scope.breadcrumbItems.length
            });

            // Load child items.
            $scope.categories = getChildCategories(categoryItem.id);
        }

        function getChildCategories(rootId, orEmpty){
            return allCategories.filter(function(item){
                var result = item.parentId === rootId;
                if (orEmpty){
                    return  result || item.parentId === '';
                }
                return result;
            });
        }
    }
})(angular);



/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('ordersController', OrdersController);

    OrdersController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames', 'utils','$state', 'print'];
    function OrdersController($scope, $mdDialog ,toastsPresenter,repository,modelNames, utils, $state, print){

        var saleOrderDtl = [];
        $scope.saleOrders = [];

        $scope.print = printOrder;
        $scope.saveHeader = saveHeader;
        $scope.setCurrentOrder = setCurrentOrder;
        $scope.saveComments = saveComments;


        function printOrder(){
            if (!$scope.selectedOrder){
                toastsPresenter.info('Выберите заказ');
            }
            print.printOrder($scope.selectedOrder);
        };

        function saveHeader(){
            var headerId = $scope.selectedOrder._saleOrderHeader.id;
            var headerData = $scope.selectedOrder._saleOrderHeader;
            // update
            repository.updateModelItem(modelNames.SALE_ORDER_HEADER, headerId,headerData).then(function(){
                toastsPresenter.info('Информация сохранена.');
            }, function(error){
                console.error('SALE_ORDER_HEADER');
                console.error(error);
            });
        }

        function saveComments(){
            var saleOrderId = $scope.selectedOrder.id;
            var commentData = {
                comment: $scope.selectedOrder.comment,
                response: $scope.selectedOrder.response
            }
            // update
            repository.updateModelItem(modelNames.SALE_ORDER, saleOrderId, commentData).then(function(){
                toastsPresenter.info('Информация сохранена.');
            }, function(error){
                console.error('SALE_ORDER');
                console.error(error);
            });
        }

        // TODO: remove
        $scope.removeAll = function () {

            angular.forEach(saleOrderDtl, function(item){
                repository.removeModelItem(modelNames.SALE_ORDER_DTL, item.id);
            });

            angular.forEach($scope.saleOrders, function (item) {
                repository.removeModelItem(modelNames.SALE_ORDER, item.id);
            });
        };

        function setCurrentOrder(order){
            $scope.selectedOrder = order;
            $scope.selectedOrder._saleOrderHeader = $scope.selectedOrder._saleOrderHeader || {};
        };

        repository.reloadModelItems([modelNames.USER, modelNames.SET, modelNames.SALE_ITEM, modelNames.SALE_ITEM_DTL,
            modelNames.PRICE, modelNames.CATEGORY, modelNames.SALE_ORDER, modelNames.SALE_ORDER_DTL,
            modelNames.SALE_ORDER_HEADER]).then(function(){

            saleOrderDtl = repository.getModelItems(modelNames.SALE_ORDER_DTL);

            repository.buildModelItemData(modelNames.SALE_ORDER);

            $scope.saleOrders = repository.getModelItems(modelNames.SALE_ORDER);

        }, function (error) {
            console.log(error);
            toastsPresenter.error('Возникла при загрузке.');
        });
    }
})(angular);



/**
 * Created by Serg on 04.05.2015.
 */
(function(angular) {
    angular.module('app').controller('printController', PrintOrdersController);

    PrintOrdersController.$inject = ['$scope', 'print','$state', 'repository', 'modelNames','utils', '$filter'];
    function PrintOrdersController($scope, print, $state, repository, modelNames, utils, $filter){

        var accessoryCategoryName = 'Аксессуары';

        repository.reloadModelItems(modelNames.CATEGORY).then(function(){
            $scope.categories =  repository.getModelItems(modelNames.CATEGORY);

            var accCat = utils.getItemById($scope.categories, accessoryCategoryName, 'name');
            if(accCat){
              $scope.accessoryId = accCat.id;
            }
        });

        $scope.$watch('accessoryId', function (value) {
            $scope.saleOrderDtl = $filter('saleItemFilter')($scope.order._saleOrderDtl, value);
            $scope.saleOrderDtlAcc = $filter('saleAccessoryFilter')($scope.order._saleOrderDtl, value);
        });

        $scope.showPrices = true;
        $scope.order = print.getOrder();

        if (!$scope.order){
            $state.go('main');
        }
    }
})(angular);



/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('rolesController', RolesController);

    RolesController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames'];
    function RolesController($scope,$mdDialog,toastsPresenter,repository,modelNames){

        var gridAPI;
        $scope.vm = {};

        reloadItems();

        $scope.addItem = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/role.html',
                controller:'roleController',
                locals: { dialogData: {titleText: "Добавление роли"}}
            });

            dialogPromise.then(function(modelData){

                if (!modelData)
                {
                    console.error('Form data is empty');
                    return;
                }
                repository.createModelItem(modelNames.ROLE, modelData).then(function (data) {
                    toastsPresenter.operationSucceeded();

                    reloadItems();

                }, function (error) {
                    console.log(error);
                    toastsPresenter.error('Возникла ошибка');
                });

            }, function () {
                toastsPresenter.operationCanceled();
            });
        };

        $scope.editItem = function(itemId){
            repository.getModelItem(modelNames.ROLE,itemId).then(function(data){
                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/role.html',
                    controller:'roleController',
                    locals: { dialogData: {titleText: "Изменение роли", model: data}}
                });

                dialogPromise.then(function(modelData){
                    if (!modelData)
                    {
                        console.error('Form data is empty');
                        return;
                    }

                    repository.updateModelItem(modelNames.ROLE, itemId, modelData).then(function (data) {
                        toastsPresenter.operationSucceeded();
                        reloadItems();
                    }, function (error) {
                        console.log(error);
                        toastsPresenter.error('Возникла ошибка');
                    });

                }, function () {
                    toastsPresenter.operationCanceled();
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.ROLE, itemId).then(function(){
                toastsPresenter.operationSucceeded();
                reloadItems();
            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
            });
        };

        $scope.vm.gridOptions = {
            columnDefs: [
                {field: 'name', displayName:'Название роли'},
                {
                    field: ' ',
                    displayName:'',
                    width:'80',
                    enableColumnMenu: false,
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                    '</div>'
                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        function reloadItems(){
            repository.reloadModelItems(modelNames.ROLE).then(function () {
                console.log('reload roles');
                $scope.vm.gridOptions.data = repository.getModelItems(modelNames.ROLE);
            }, function (error) {
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
                $scope.vm.gridOptions.data = [];
            });
        }

    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('saleItemsController', SaleItemsController);

    SaleItemsController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames','utils'];
    function SaleItemsController($scope,$mdDialog,toastsPresenter,repository,modelNames,utils){

        console.log('SaleItems Controller load');

        var categoriesList = [];
        var setList = [];

        repository.reloadModelItems([modelNames.CATEGORY, modelNames.SET, modelNames.PRICE, modelNames.SALE_ITEM,
            modelNames.SALE_ITEM_DTL]).then(function(){

            categoriesList = repository.getModelItems(modelNames.CATEGORY);
            setList = repository.getModelItems(modelNames.SET);

        }, function(error){
            console.log(error);
            toastsPresenter.error('Ошибка при загрузке');
        });

        var gridAPI;
        $scope.vm = {};

        reloadItems();

        $scope.addItem = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/saleItem.html',
                controller:'saleItemController',
                locals: { dialogData: {titleText: "Добавление товара", categories: categoriesList, sets: setList}}
            });

            dialogPromise.then(function(modelData){
                if (!modelData)
                {
                    console.error('Form data is empty');
                    return;
                }

                repository.createModelItem(modelNames.SALE_ITEM, modelData).then(function (data) {
                    toastsPresenter.operationSucceeded();
                    reloadItems();
                }, function (error) {
                    console.log(error);
                    toastsPresenter.error('Возникла ошибка');
                });

            }, function () {
                toastsPresenter.operationCanceled();
            });
        };

        $scope.editPhoto = function(itemId){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/photo.html',
                controller:'photoController',
                locals: { dialogData: { modelName:modelNames.SALE_ITEM, itemId: itemId, titleText:'Работа с фото' }}
            });
        };

        $scope.editPrice = function (itemId) {
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/price.html',
                controller:'priceController',
                locals: { dialogData: { itemId: itemId, titleText:'Работа с ценами' }}
            });
        };

        $scope.editItem = function(itemId){

            repository.getModelItem(modelNames.SALE_ITEM, itemId).then(function(data){
                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/saleItem.html',
                    controller:'saleItemController',
                    locals: { dialogData: {titleText: "Изменение товара", model: data,  categories: categoriesList, sets: setList}}
                });

                dialogPromise.then(function(modelData){
                    if (!modelData)
                    {
                        console.error('Form data is empty');
                        return;
                    }
                    console.log('update:'+itemId);
                    console.log(modelData);

                    repository.updateModelItem(modelNames.SALE_ITEM, itemId, modelData).then(function () {
                        toastsPresenter.operationSucceeded();
                        reloadItems();
                    }, function (error) {
                        console.log(error);
                        toastsPresenter.error('Возникла ошибка');
                    });

                }, function () {
                    toastsPresenter.operationCanceled();
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.editDetails = function(itemId){
            repository.getModelItem(modelNames.SALE_ITEM, itemId).then(function(data){

                repository.getModelItem(modelNames.SALE_ITEM_DTL,itemId).then(function(detailsEntity){
                    if (detailsEntity.id){
                        changeDetails(detailsEntity);
                    }
                    else{
                        changeDetails();
                    }
                }, function(){
                    toastsPresenter.error('Невозможно найти запись.');
                });

                function changeDetails(detailsEntity){
                    var isEdit = detailsEntity !== undefined;
                    var dialogPromise = $mdDialog.show({
                        templateUrl:'app/models/saleItemDtl.html',
                        controller:'saleItemDtlController',
                        locals: { dialogData: {titleText: "Детализация", model: detailsEntity,  saleItem:data}}
                    });

                    dialogPromise.then(function(modelData){
                        if (!modelData)
                        {
                            console.error('Form data is empty');
                            return;
                        }
                        console.log('create/update:'+ itemId);
                        console.log(modelData);

                        // Change item
                        if(isEdit)
                        {
                            repository.updateModelItem(modelNames.SALE_ITEM_DTL, itemId, modelData).then(function () {
                                toastsPresenter.operationSucceeded();
                                reloadItems();
                            }, function (error) {
                                console.log(error);
                                toastsPresenter.error('Возникла ошибка');
                            });
                        }
                        // Create new details
                        else
                        {
                            modelData.id = itemId;
                            repository.createModelItem(modelNames.SALE_ITEM_DTL,modelData).then(function (data) {
                                toastsPresenter.operationSucceeded();
                                reloadItems();
                            }, function (error) {
                                console.log(error);
                                toastsPresenter.error('Возникла ошибка');
                            });
                        }



                    }, function () {
                        toastsPresenter.operationCanceled();
                    });
                }

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.SALE_ITEM, itemId).then(function(){
                toastsPresenter.operationSucceeded();
                repository.removeModelItem(modelNames.SALE_ITEM_DTL, itemId).catch(function(){
                    console.error('Can\'t delete details items for '+ itemId)
                });
                reloadItems();
            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
            });
        };

        $scope.vm.gridOptions = {
            columnDefs: [
                {field: 'name',displayName:'Название'},
                {field: 'code',displayName:'Код'},
                {field: '_category.name',displayName:'Категория'},
                {field: '_set.name',displayName:'Комплект'},
                {field: 'comment',displayName:'Комментарий', enableColumnMenu: false},
                {field: '_price.cost', displayName:'Цена', enableColumnMenu: false, width: 80},
                {field: 'inDollars',displayName:'$', width: 40,enableColumnMenu: false,
                    cellTemplate:   '<div class="cell-item" layout="row" layout-align="center center">' +
                    ' <md-checkbox data-ng-disabled="true" aria-label="В долларах" ' +
                    'ng-model="row.entity._price.inDollars" class="md-primary" /> </div>'
                },
                {
                    field: ' ',
                    enableColumnMenu: false,
                    displayName:'',
                    width:'150',
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editDetails(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-tasks" aria-label="Details"></span></md-button>'+
                    '<md-button class="md-primary action-button" ng-click="grid.appScope.editPhoto(row.entity.id)">' +
                    '<span class="glyphicon glyphicon-picture" aria-label="Work with photo"></span></md-button>'+
                    '<md-button class="md-primary action-button" ng-click="grid.appScope.editPrice(row.entity.id)">' +
                    '<span class="glyphicon glyphicon-euro" aria-label="Work with photo"></span></md-button>'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button> ' +
                    '</div>'
                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        function reloadItems(){
            repository.reloadModelItems(modelNames.SALE_ITEM).then(function () {
                $scope.vm.gridOptions.data = repository.getModelItems(modelNames.SALE_ITEM);
                repository.buildModelItemData(modelNames.SALE_ITEM);
            }, function (error) {
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
                $scope.vm.gridOptions.data = [];
            });
        }
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('setsController', SetsController);

    SetsController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames'];
    function SetsController($scope,$mdDialog,toastsPresenter,repository,modelNames){

        var gridAPI;
        $scope.vm = {};

        var saleItems = [];

        repository.reloadModelItems([modelNames.SET, modelNames.SALE_ITEM]).then(function(){
            saleItems = repository.getModelItems(modelNames.SALE_ITEM);
        }, function (error) {
            console.log(error);
            toastsPresenter.error('Возникла при загрузке.');
        });
        
        reloadItems();

        $scope.addItem = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/set.html',
                controller:'setController',
                locals: { dialogData: {titleText: "Добавление коплекта"}}
            });

            dialogPromise.then(function(modelData){
                if (!modelData)
                {
                    console.error('Form data is empty');
                    return;
                }

                repository.createModelItem(modelNames.SET, modelData).then(function (data) {
                    toastsPresenter.operationSucceeded();
                    reloadItems();

                }, function (error) {
                    console.log(error);
                    toastsPresenter.error('Возникла ошибка');
                });
            }, function () {
                toastsPresenter.operationCanceled();
            });
        };

        $scope.editItem = function(itemId)
        {
            repository.getModelItem(modelNames.SET, itemId).then(function(data){
                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/set.html',
                    controller:'setController',
                    locals: { dialogData: {titleText: "Изменение коплекта", model: data}}
                });

                dialogPromise.then(function(modelData){
                    if (!modelData)
                    {
                        console.error('Form data is empty');
                        return;
                    }

                    repository.updateModelItem(modelNames.SET, itemId, modelData).then(function () {
                        toastsPresenter.operationSucceeded();
                        reloadItems();
                    }, function (error) {
                        console.log(error);
                        toastsPresenter.error('Возникла ошибка');
                    });

                }, function () {
                    toastsPresenter.operationCanceled();
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.SET, itemId).then(function(){
                toastsPresenter.operationSucceeded();
                reloadItems();
            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
            });
        };

        $scope.editSetItems = function(itemId){
            repository.getModelItem(modelNames.SET, itemId).then(function(data){
                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/setItems.html',
                    controller:'setItemsController',
                    locals: { dialogData: {titleText: "Работа с комплектом", model: data, saleItems:saleItems}}
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.vm.gridOptions = {
            columnDefs: [
                {field: 'name', displayName:'Название коплекта', width:'250'},
                {field: 'description', displayName:'Описание'},
                {
                    field: ' ',
                    displayName:'',
                    width:'110',
                    enableColumnMenu: false,
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editSetItems(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-tasks" aria-label="Set items"></span></md-button>'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                    '</div>'
                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        function reloadItems(){
            repository.reloadModelItems(modelNames.SET).then(function () {
                $scope.vm.gridOptions.data = repository.getModelItems(modelNames.SET);
            }, function (error) {
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
                $scope.vm.gridOptions.data = [];
            });
        }

    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app').controller('usersController', UsersController);

    UsersController.$inject = ['$scope','$mdDialog','toastsPresenter','repository','modelNames'];
    function UsersController($scope,$mdDialog,toastsPresenter,repository,modelNames){
        console.log('users controller load');

        var rolesList = {};

        repository.reloadModelItems([modelNames.ROLE, modelNames.USER]).then(function(){
            rolesList = repository.getModelItems(modelNames.ROLE);

            repository.buildModelItemData(modelNames.USER);

        }, function(error){
            console.log(error);
            toastsPresenter.error('Ошибка при загрузке.');
        });

        var gridAPI;
        $scope.vm = {};

        reloadItems();

        $scope.addItem = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/user.html',
                controller:'userController',
                locals: { dialogData: {titleText: "Добавление пользователя", roles:rolesList}}
            });

            dialogPromise.then(function(modelData){
                if (!modelData)
                {
                    console.error('Form data is empty');
                    return;
                }

                repository.createModelItem(modelNames.USER, modelData).then(function (data) {
                    toastsPresenter.operationSucceeded();

                    reloadItems();

                }, function (error) {
                    console.log(error);
                    toastsPresenter.error('Возникла ошибка');
                });

            }, function () {
                toastsPresenter.operationCanceled();
            });
        };

        $scope.editItem = function(itemId){

            repository.getModelItem(modelNames.USER, itemId).then(function(data){
                var dialogPromise = $mdDialog.show({
                    templateUrl:'app/models/user.html',
                    controller:'userController',
                    locals: { dialogData: {titleText: "Изменение роли", model: data, roles:rolesList}}
                });

                dialogPromise.then(function(modelData){
                    if (!modelData)
                    {
                        console.error('Form data is empty');
                        return;
                    }

                    repository.updateModelItem(modelNames.USER, itemId, modelData).then(function () {

                        toastsPresenter.operationSucceeded();
                        reloadItems();
                    }, function (error) {
                        console.log(error);
                        toastsPresenter.error('Возникла ошибка');
                    });

                }, function () {
                    toastsPresenter.operationCanceled();
                });

            }, function(error){
                toastsPresenter.error('Невозможно найти запись.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.USER, itemId).then(function(){
                toastsPresenter.operationSucceeded();
                reloadItems();
            }, function(error){
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
            });
        };

        $scope.vm.gridOptions = {
            columnDefs: [
                {field: 'login',displayName:'Логин'},
                {field: 'fio',displayName:'ФИО'},
                {field: '_role.name',displayName:'Роль'},
                {field: 'isActive',displayName:'Активный',
                    cellTemplate:   '<div class="cell-item" layout="row" layout-align="center center"> <md-checkbox data-ng-disabled="true" aria-label="Активный ли пользователь" ' +
                                    'ng-model="row.entity.isActive" class="md-primary" /> </div>'
                },
                {field: 'comment',displayName:'Комментарий', enableColumnMenu: false},
                {
                    field: ' ',
                    enableColumnMenu: false,
                    displayName:'',
                    width:'80',
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                    '</div>'

                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        function reloadItems(){
            repository.reloadModelItems(modelNames.USER).then(function () {
                repository.buildModelItemData(modelNames.USER);

                $scope.vm.gridOptions.data = repository.getModelItems(modelNames.USER);;
            }, function (error) {
                console.log(error);
                toastsPresenter.error('Возникла ошибка');
                $scope.vm.gridOptions.data = [];
            });
        }
    }
})(angular);


(function(angular){

    angular.module('app.models', ['app.services']);

})(angular);

/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('categoryController', CategoryController);

    CategoryController.$inject = ['$scope','$mdDialog','dialogData','utils','modelNames'];
    function CategoryController($scope,$mdDialog, dialogData,utils,modelNames) {
        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.categories = dialogData.categories;

        $scope.pictureSrc = utils.buildPictureSrc(modelNames.CATEGORY, $scope.modelData.id);

        $scope.editPhoto = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/photo.html',
                controller:'photoController',
                locals: { dialogData: { modelName:modelNames.CATEGORY, itemId: $scope.modelData.id, titleText:'Работа с фото' }}
            });
        };

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by Serg on 21.03.2015.
 */

(function(angular) {
    angular.module('app').controller('photoController', PhotoController);

    PhotoController.$inject = ['$scope','$mdDialog','$http','toastsPresenter','modelNames','dialogData','FileUploader','utils'];
    function PhotoController($scope, $mdDialog,$http, toastsPresenter, modelNames, dialogData,FileUploader,utils){
        console.log('photo controller load');

        $scope.uploader = new FileUploader();

        initUploaderSettings($scope.uploader);

        var removeUrl = 'api/upload/delete/'+dialogData.modelName+'/'+dialogData.itemId;

        $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);

        $scope.uploader.onSuccessItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();
            toastsPresenter.operationSucceeded();
            $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);
        };
        $scope.uploader.onErrorItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();
            toastsPresenter.error('Ошибка при загрузке файла');
        };

        $scope.removeItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();

            console.log('remove start');
            $http.post(removeUrl).then(function(){
                toastsPresenter.success('Изображение удалено.');
                $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);
            }, function(){
                toastsPresenter.error('Ошибка удалении изображения.');
            });
        };
        $scope.uploadItem = function(){
            $scope.uploader.uploadAll();
        };

        $scope.uploader.onAfterAddingFile = function(){
            $scope.isFileSelected = true;
        };

        $scope.titleText =  dialogData.titleText;

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };

        function initUploaderSettings(uploader){
            uploader.queueLimit = 1;
            uploader.url = 'api/upload/'+dialogData.modelName+'/'+dialogData.itemId;
            uploader.filters.push({
                name: 'only png files',
                fn: function(item) {
                  if (item.type === 'image/png'){
                      return true;
                  }
                    toastsPresenter.error('Используйте изображение в формате png.');
                    return false;
                }
            });
        };


    }
})(angular);



/**
 * Created by Serg on 21.03.2015.
 */

(function(angular) {
    angular.module('app').controller('priceController', PriceController);

    PriceController.$inject = ['$scope','$mdDialog','$filter','toastsPresenter','dialogData','repository', 'modelNames','utils'];
    function PriceController($scope, $mdDialog,$filter,toastsPresenter, dialogData,repository, modelNames,utils){
        console.log('price controller load');

        $scope.modelData = {};

        var searchParams = {
            saleItemId: dialogData.itemId
        };

        reloadPrices();

        $scope.gridOptions = {
            columnDefs: [
                {field: 'fromDate', displayName:'Действует с', enableColumnMenu: false,
                    cellTemplate:'<span class="cell-item">{{row.entity.fromDate| date:"dd/MMM/yyyy"}}</span>'},
                {field: 'cost', displayName:'Цена', enableColumnMenu: false},
                {field: 'inDollars',displayName:'В долларах', enableColumnMenu: false,
                    cellTemplate:   '<div class="cell-item" layout="row" layout-align="center center"> ' +
                    '<md-checkbox data-ng-disabled="true" aria-label="В долларах" ' +
                    'ng-model="row.entity.inDollars" class="md-primary" /> </div>'
                },
                {
                    field: ' ',
                    displayName:'',
                    width:'80',
                    enableColumnMenu: false,
                    cellTemplate:
                    '<div layout="row" layout-align="center center">'+
                    '<md-button class="md-primary action-button" ng-click="grid.appScope.editItem(row.entity.id)">' +
                    '<span class="glyphicon glyphicon-edit" aria-label="Edit"></span></md-button>'+
                    '<md-button class="md-warn action-button" aria-label="Delete" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                    '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                    '</div>'
                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                gridAPI = gridApi;
            }
        };

        $scope.titleText =  dialogData.titleText;

        $scope.addItem = function () {
            var newItem = {
                saleItemId:dialogData.itemId,
                cost:$scope.modelData.cost,
                fromDate: $filter('date')($scope.modelData.fromDate,'dd/MMM/yyyy'),
                inDollars:$scope.modelData.inDollars
            };

            repository.createModelItem(modelNames.PRICE, newItem).then(function(){
                toastsPresenter.success('Запись добавлена.')
            }, function(){
                toastsPresenter.success('Ошибка при добавлении записи');
            });

            reloadPrices();
        };

        $scope.editItem = function (itemId) {
             var editItem = utils.getItemById($scope.gridOptions.data, itemId);
            editItem.fromDate = new Date(editItem.fromDate);
            $scope.modelData = editItem;
        };

        $scope.saveItem = function(){
            repository.updateModelItem(modelNames.PRICE, $scope.modelData.id, $scope.modelData).then(function () {
                toastsPresenter.operationSucceeded();
            }, function(){
                toastsPresenter.error('Ошибка при обновлении.');
            });
        };

        $scope.removeItem = function(itemId){

            repository.removeModelItem(modelNames.PRICE, itemId).then(function(){
               reloadPrices();
                toastsPresenter.operationSucceeded();
            }, function(){
                toastsPresenter.error('Ошибка при удалении записи.');
            });
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };

        function reloadPrices(){

            repository.loadFilteredModelItems(modelNames.PRICE, {params:searchParams}).then(function (data) {
                console.log('load prices');
                $scope.gridOptions.data = data;
            }, function(){
                toastsPresenter.error('Ошибка при загрузке цен');
            });
        };
    }
})(angular);



/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('roleController', RoleController);

    RoleController.$inject = ['$scope','$mdDialog','dialogData'];
    function RoleController($scope,$mdDialog, dialogData) {
        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('saleItemController', SaleItemController);

    SaleItemController.$inject = ['$scope','$mdDialog','dialogData'];
    function SaleItemController($scope, $mdDialog, dialogData) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.categories = dialogData.categories;
        $scope.sets = dialogData.sets;

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('saleItemDtlController', SaleItemDtlController);

    SaleItemDtlController.$inject = ['$scope','$mdDialog','dialogData'];
    function SaleItemDtlController($scope, $mdDialog, dialogData) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.saleItem = dialogData.saleItem;

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('setController', SetController);

    SetController.$inject = ['$scope','$mdDialog','dialogData'];
    function SetController($scope,$mdDialog, dialogData) {
        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('setItemsController', SetItemsController);

    SetItemsController.$inject = ['$scope','$mdDialog','dialogData','repository','modelNames','toastsPresenter','utils'];
    function SetItemsController($scope,$mdDialog, dialogData,repository,modelNames, toastsPresenter,utils) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }
        if (!dialogData.model){
            console.error('dialog model data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.setName = dialogData.model.name;
        $scope.modelData = dialogData.model;

        $scope.vm = {};

        initializeGridOptions();


        $scope.vm.setItemsGridOptions.data = [];

        var searchParams = {
            setId: $scope.modelData.id
        };

        reloadItems();

        $scope.incrementCount = function(itemId){
            var setItem = utils.getItemById($scope.vm.setItemsGridOptions.data,itemId);
            var updateData = {
                count: setItem.count + 1
            };

            repository.updateModelItem(modelNames.SET_ITEM, itemId, updateData).then(function(){
                setItem.count++;
                toastsPresenter.success('Запись обновлена.');
            }, function(){
                toastsPresenter.error('Ошибка при обновлении записи.');
            });
        };

        $scope.decrementCount = function(itemId){
            var setItem = utils.getItemById($scope.vm.setItemsGridOptions.data,itemId);
            var updateData = {
                count: setItem.count - 1
            };
            if (updateData.count == 0)
            {
                toastsPresenter.info('Количество должно быть больше 0.');
                return;
            }

            repository.updateModelItem(modelNames.SET_ITEM, itemId, updateData).then(function(){
                setItem.count--;
                toastsPresenter.success('Запись обновлена.');
            }, function(){
                toastsPresenter.error('Ошибка при обновлении записи.');
            });
        };

        $scope.removeItem = function(itemId){
            repository.removeModelItem(modelNames.SET_ITEM, itemId).then(function(){
                var elementIndex =  utils.findIndexById($scope.vm.setItemsGridOptions.data,itemId);
                if(elementIndex !=-1)
                {
                    $scope.vm.setItemsGridOptions.data.splice(elementIndex,1);
                }

                $scope.vm.saleItemsGridOptions.data =
                    normalizeSaleItemsList($scope.vm.setItemsGridOptions.data);

                toastsPresenter.success('Запись удалена.');
            }, function(){
                toastsPresenter.error('Ошибка при удалении записи.');
            });
        };

        $scope.addToSet = function (itemId) {

            var setItem = {
                setId: $scope.modelData.id,
                saleItemId: itemId,
                count:1
            };

            console.log(setItem);

            repository.createModelItem(modelNames.SET_ITEM, setItem).then(function () {
                reloadItems();
                toastsPresenter.success('Запись добавлена.');
            }, function(){
                toastsPresenter.error('Ошибка при добавлении записи.');
            });

        };

        // Remove items which are already in set.
        function normalizeSaleItemsList(setItems){
            return dialogData.saleItems.filter(function(saleItem){
                return utils.findIndexById(setItems,saleItem.id, 'saleItemId') == -1;
            });
        }

        function reloadItems(){

            repository.loadFilteredModelItems(modelNames.SET_ITEM, {params:searchParams}).then(function (data){

                repository.buildModelItemData(modelNames.SET_ITEM, data);

                $scope.vm.setItemsGridOptions.data = data;
                $scope.vm.saleItemsGridOptions.data = normalizeSaleItemsList(data);

            }, function(error){
                $scope.vm.setItemsGridOptions.data = [];
            });
        };

        function initializeGridOptions(){
            $scope.vm.setItemsGridOptions = {
                columnDefs: [
                    {field: '_saleItem.name', displayName:'Название товара', enableColumnMenu:false},
                    {field: '_saleItem.code', displayName:'Код', width:'100', enableColumnMenu:false},
                    {field: 'count', displayName:'К-во',width:'50', enableColumnMenu:false},
                    {
                        field: ' ',
                        displayName:'',
                        width:'110',
                        enableColumnMenu: false,
                        cellTemplate:
                        '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.incrementCount(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-plus" aria-label="Increment items count"></span></md-button>'+
                        '<md-button class="md-primary action-button" ng-click="grid.appScope.decrementCount(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-minus" aria-label="Decrement items count"></span></md-button>'+
                        '<md-button class="md-warn action-button" aria-label="Remove item from set" ng-click="grid.appScope.removeItem(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-remove"></span></md-button>'+
                        '</div>'
                    }
                ],
                data:[],
                onRegisterApi: function (gridApi) {
                }
            };

            $scope.vm.saleItemsGridOptions = {
                    enableFiltering:true,
                    columnDefs: [
                    {field: 'name', displayName:'Название товара', enableColumnMenu:false},
                    {field: 'code', displayName:'Код', width:'100', enableColumnMenu:false},
                    {field: 'comment', displayName:'Комментарий', enableColumnMenu:false, enableFiltering: false},
                    {
                        field: ' ',
                        displayName:'',
                        width:'40',
                        enableColumnMenu: false,
                        enableFiltering: false,
                        cellTemplate:
                        '<div layout="row" layout-align="center center">'+
                        '<md-button class="md-primary action-button" aria-label="Add item to set" ng-click="grid.appScope.addToSet(row.entity.id)">' +
                        '<span class="glyphicon glyphicon-log-in"></span></md-button>'+
                        '</div>'
                    }
                ],
                data:[],
                onRegisterApi: function (gridApi) {
                }
            };
        };



        // TODO: add validation

        $scope.close = function(){
            $mdDialog.hide();
        };
    }
})(angular);


/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('userController', UserController);

    UserController.$inject = ['$scope','$mdDialog','dialogData'];
    function UserController($scope,$mdDialog, dialogData) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.roles = dialogData.roles;

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);


/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){

    angular.module('app.services', []);

})(angular);

/**
 * Created by Serg on 22.03.2015.
 */

(function(angular) {
    angular.module('app.services').service('basket', createService);

    createService.$inject = ['localStorageService'];

    function createService(localStorageService) {

        var STORAGE_KEY = 'basket';
        var lastUpdateDate;

        if(!localStorageService.get(STORAGE_KEY)){
            localStorageService.add(STORAGE_KEY,{});
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
            localStorageService.set(STORAGE_KEY,{});
        }

        function addItem(item){

            var bsk = localStorageService.get(STORAGE_KEY);
            if (!bsk[item.id]){

                bsk[item.id] = {
                    count: item.count || 1,
                    childItemsMap: item.childItemsMap||{}
                };

                localStorageService.set(STORAGE_KEY, bsk);
                lastUpdateDate = new Date();
            }
        };

        function removeItem(id){
            var bsk = localStorageService.get(STORAGE_KEY);
            if(bsk[id]){
                bsk[id] = undefined;
                localStorageService.set(STORAGE_KEY, bsk);
                lastUpdateDate = new Date();
            }
        };

        function updateItemCount(id, count) {
            var bsk = localStorageService.get(STORAGE_KEY);
            if (bsk[id]) {
                bsk[id].count = count;
                localStorageService.set(STORAGE_KEY, bsk);
                lastUpdateDate = new Date();
            }
        };

        function getBasketInfo(){
            var allCount = 0;
            var bsk = localStorageService.get(STORAGE_KEY);
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

/**
 * Created by PIPON on 28.02.2015.
 */

(function (angular) {
    angular.module('app.services').constant('commonConfig', {
        API_PREFIX: 'api'
    });
})(angular);

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

/**
 * Created by PIPON on 09.03.2015.
 */


(function (angular) {
    angular.module('app.services').constant('modelNames', {
        ROLE: 'role',
        USER:'user',
        PRICE:'price',
        SALE_ITEM:'saleItem',
        SALE_ITEM_DTL:'saleItemDtl',
        SALE_ORDER:'saleOrder',
        SALE_ORDER_DTL:'saleOrderDtl',
        SALE_ORDER_HEADER:'saleOrderHeader',
        SET:'set',
        SET_ITEM:'setItem',
        CATEGORY:'category'
    });
})(angular);


/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){
    angular.module('app.services').factory('ModelsManager', createFactory);

    createFactory.$inject = ['$http','$q','commonConfig'];

    function createFactory($http,$q,commonConfig){

        function ModelsManager(modelName){
            var paths = {
                create: '',
                update: '',
                remove: '',
                getOne: '',
                getAll: ''
            };

            initialize(modelName);

            this.create = function(item){
                console.log('start create');
                var defer = $q.defer();

                $http.post(paths.create, item).success(function (data) {
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });
                return defer.promise;
            };

            this.getAll =  function (config) {
                var defer =  $q.defer();

                $http.get(paths.getAll, config).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });

                return defer.promise;
            };

            this.getAllWithMap = function(){
                var map = {};
                var defer =  $q.defer();
                $http.get(paths.getAll).success(function(data){
                    data.forEach(function(item){
                        map[item.id] = item;
                    });
                    defer.resolve({
                        itemsList: data,
                        itemsMap: map
                    });
                }).error(function(error){
                    defer.reject(error);
                });
                return defer.promise;
            };

            this.getOne = function(id) {
                var defer =  $q.defer();
                var path = paths.getOne + id;

                $http.get(path).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });

                return defer.promise;
            };

            this.update = function(id, data) {
                console.log('start update');
                var defer =  $q.defer();

                $http.post(paths.update, { id: id, data:data}).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });

                return defer.promise;
            };

            this.remove = function(id) {
                var defer =  $q.defer();

                $http.post(paths.remove, { id: id }).success(function (data) {
                    console.log('remove client:'+id);
                    defer.resolve(data);
                }).error(function(error){
                    console.log('remove client error:'+id);
                    defer.reject(error);
                });

                return defer.promise;
            };

            function initialize(modelName){
                paths.create = commonConfig.API_PREFIX +'/'+ modelName+'/new';
                paths.getAll = commonConfig.API_PREFIX +'/'+ modelName+'s';
                paths.getOne = commonConfig.API_PREFIX +'/'+ modelName+'/';
                paths.update = commonConfig.API_PREFIX +'/'+ modelName+'/update';
                paths.remove = commonConfig.API_PREFIX +'/'+ modelName+'/delete';
            };
        }
        return ModelsManager;
    }
})(angular);



/**
 * Created by Serg on 05.04.2015.
 */

angular.module('app.services').filter('name', function() {
    return function(input, nameValue) {
        if (!nameValue){
            return input;
        }
        nameValue = nameValue.toLowerCase();
        return input.filter(function(item){
            return item.name.toLowerCase().indexOf(nameValue) > -1;
        });
    };
});
/**
 * Created by Serg on 04.05.2015.
 */

(function(angular) {
    angular.module('app.services').service('print', createService);

    createService.$inject = ['$state', 'localStorageService'];
    function createService($state, localStorageService) {
        var ORDER_KEY = 'order';

        this.printOrder = printOrder;
        this.getOrder = getOrder;
        this.resetOrder = resetOrder;

        function printOrder(order){
            $state.go('print');
            localStorageService.set(ORDER_KEY, order);
        }

        function getOrder(){
            return localStorageService.get(ORDER_KEY);
        }

        function resetOrder(){
            localStorageService.remove(ORDER_KEY)
        };

    }
})(angular);

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
            if (dataHolder[modelName] !== undefined && dataHolder[modelName].itemsList != undefined){
                return dataHolder[modelName].itemsList;
            }
            return [];
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



/**
 * Created by Yuriy on 14.03.2015.
 */
(function(angular){
    angular.module('app.services').service('toastsPresenter', createService);

    createService.$inject = ['$mdToast','$rootScope'];

    function createService($mdToast,$rootScope){

        var operationResultClasses = {
            SUCCESS: 'success',
            INFORMATION:'information',
            ERROR: 'error'
        };

        this.operationSucceeded = function(){
            showCustom(operationResultClasses.SUCCESS, 'Операция выполнена успешно.');
        };

        this.operationCanceled = function(){
            showCustom(operationResultClasses.INFORMATION, 'Операция отменена');
        };

        this.success = function(text){
            showCustom(operationResultClasses.SUCCESS, text);
        };

        this.error = function(text){
            showCustom(operationResultClasses.ERROR, text);
        };

        this.info = function(text){
            showCustom(operationResultClasses.INFORMATION, text);

        };

        var showCustom = function(type, text){
            var localScope = $rootScope.$new();
            localScope.message = text;
            localScope.type =type;
            $mdToast.show({
                templateUrl:'app/templates/toast.html',
                scope: localScope
            });
        }
    }
})(angular);


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
            return '/images/'+modelName+'/'+itemId+'.'+formatName+'?'+ Math.random();
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
