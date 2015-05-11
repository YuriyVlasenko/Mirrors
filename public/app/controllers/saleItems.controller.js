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

