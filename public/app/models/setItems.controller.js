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

            repository.loadFilteredModelItems(modelNames.SET_ITEM, searchParams).then(function (data){

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

