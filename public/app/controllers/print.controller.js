/**
 * Created by Serg on 04.05.2015.
 */
(function(angular) {
    angular.module('app').controller('printController', PrintOrdersController);

    PrintOrdersController.$inject = ['$scope', 'print','$state', 'repository', 'modelNames','utils', '$filter'];
    function PrintOrdersController($scope, print, $state, repository, modelNames, utils, $filter){

        var accessoryCategoryName = 'Аксессуары';
        var saleOrderHeaders;

        repository.reloadModelItems([modelNames.CATEGORY, modelNames.SALE_ORDER_HEADER]).then(function(){
            $scope.categories =  repository.getModelItems(modelNames.CATEGORY);

            var accCat = utils.getItemById($scope.categories, accessoryCategoryName, 'name');
            if(accCat){
              $scope.accessoryId = accCat.id;
            }
        });

        var saleOrderDtl = [];
        $scope.$watch('accessoryId', function (value) {
            $scope.saleOrderDtl = saleOrderDtl = $filter('saleItemFilter')($scope.order._saleOrderDtl, value);
            $scope.saleOrderDtlAcc = $filter('saleAccessoryFilter')($scope.order._saleOrderDtl, value);
        });

        $scope.printAsSummary = false;
        $scope.singlePageNormalCount = 25;
        $scope.itemsOnPage = 30;
        $scope.fontSize = 10;
        $scope.showPrices = true;
        $scope.order = print.getOrder();
        $scope.orderNumber = $scope.order.orderNumber;
        $scope.orderDate = $filter('date')($scope.order.date, 'dd-MM-yyyy hh-mm-ss');
        $scope.updateOrderNumber = function (newOrderNumber){

        var orderNumber = parseInt(newOrderNumber);
        if (orderNumber > 0){
            repository.updateModelItem(modelNames.SALE_ORDER, 
                $scope.order.id, {
                    orderNumber: orderNumber
                });
        }
        }
        

        $scope.gotoTTN = gotoTTN;

        if (!$scope.order){
            $state.go('main');
        }

        function gotoTTN(){
            $state.go('ttn', { order: $scope.order, items: saleOrderDtl });
        }
    }
})(angular);


