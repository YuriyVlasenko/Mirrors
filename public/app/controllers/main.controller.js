/**
 * Created by PIPON on 01.03.2015.
 */

(function(angular) {
    angular.module('app').controller('mainController', MainController);

    MainController.$inject = ['$scope','$mdDialog','modelNames','utils','repository','basket', 'toastsPresenter'];
    function MainController($scope,$mdDialog,modelNames,utils,repository,basket, toastsPresenter) {

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
            $scope.categories = getChildCategories(undefined);

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

            var basketItemsMap =  basket.getBasketInfo().itemsMap;

            if (angular.isDefined(basketItemsMap[item.id])){
                toastsPresenter.info('Товар уже был добавлен.');
                return;
            }

            basket.addItem(item);
            toastsPresenter.success('Товар добавлен.');
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

        function getChildCategories(rootId){
            return allCategories.filter(function(item){
                var result = item.parentId === rootId;
                if (!rootId){
                    return  result || item.parentId === '' || item.parentId === undefined;
                }
                return result;
            });
        }
    }
})(angular);


