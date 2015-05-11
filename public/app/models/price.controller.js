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


