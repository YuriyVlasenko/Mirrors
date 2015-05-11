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

