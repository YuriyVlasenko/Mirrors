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

