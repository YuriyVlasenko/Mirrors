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


