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

