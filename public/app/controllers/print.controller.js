/**
 * Created by Serg on 04.05.2015.
 */
(function(angular) {
    angular.module('app').controller('printController', PrintOrdersController);

    PrintOrdersController.$inject = ['$scope', 'print','$state', 'repository', 'modelNames','utils', '$filter'];
    function PrintOrdersController($scope, print, $state, repository, modelNames, utils, $filter){

        var accessoryCategoryName = 'Аксессуары';

        repository.reloadModelItems(modelNames.CATEGORY).then(function(){
            $scope.categories =  repository.getModelItems(modelNames.CATEGORY);

            var accCat = utils.getItemById($scope.categories, accessoryCategoryName, 'name');
            if(accCat){
              $scope.accessoryId = accCat.id;
            }
        });

        $scope.$watch('accessoryId', function (value) {
            $scope.saleOrderDtl = $filter('saleItemFilter')($scope.order._saleOrderDtl, value);
            $scope.saleOrderDtlAcc = $filter('saleAccessoryFilter')($scope.order._saleOrderDtl, value);
        });

        $scope.printAsSummary = false;
        $scope.singlePageNormalCount = 25;
        $scope.itemsOnPage = 30;
        $scope.fontSize = 10;
        $scope.showPrices = true;
        $scope.order = print.getOrder();
        $scope.orderId = $scope.order.id.substr(0,6);
        $scope.orderDate = $filter('date')($scope.order.date, 'dd-MM-yyyy hh-mm-ss');

        if (!$scope.order){
            $state.go('main');
        }
    }
})(angular);


