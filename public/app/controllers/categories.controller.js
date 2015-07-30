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
                {field: 'comment', displayName:'Комментарий'},
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

